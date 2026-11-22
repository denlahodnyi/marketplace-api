import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { addSeconds } from 'date-fns';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { DataSource, IsNull } from 'typeorm';
import { v7 as uuidV7 } from 'uuid';

import type { Env } from '../config/index.js';

import { DeniedTokens } from '../entities/denied-tokens.entity.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { User } from '../entities/user.entity.js';

const REFRESH_GRACE_WINDOW_MS = 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly jwtService: JwtService,
    private readonly ds: DataSource,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async login(email: string) {
    const user = await this.ds.getRepository(User).findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException("Invalid password or user doesn't exist");
    }
    const token = this.jwtService.sign(
      { role: user.userRole },
      {
        jwtid: uuidV7(),
        subject: user.userId,
      },
    );

    const refreshTokensRepo = this.ds.getRepository(RefreshToken);
    const now = Date.now();
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenTtl = this.config.get('REFRESH_TOKEN_TTL_SEC', {
      infer: true,
    });
    await refreshTokensRepo.save(
      refreshTokensRepo.create({
        tokenHash: this.hashRefreshToken(refreshToken),
        familyId: randomUUID(),
        userId: user.userId,
        expiresAt: addSeconds(now, refreshTokenTtl).toISOString(),
        absoluteExpiresAt: addSeconds(now, refreshTokenTtl * 2).toISOString(),
      }),
    );

    return {
      user,
      token,
      tokenTtl: this.config.get('JWT_TTL_SEC', { infer: true }),
      refreshToken,
      refreshTokenTtl,
    };
  }

  async logout(token: string, refreshToken?: string) {
    const verifiedToken = await this.verifyAccessToken(token);
    await this.ds.transaction(async (tx) => {
      const deniedRepo = tx.getRepository(DeniedTokens);
      if (verifiedToken.jti && verifiedToken.iss) {
        await deniedRepo.save(
          deniedRepo.create({ jti: verifiedToken.jti, iss: verifiedToken.iss }),
        );
      }
      if (refreshToken) {
        const refreshTokenRepo = tx.getRepository(RefreshToken);
        const storedRefreshToken = await refreshTokenRepo.findOneBy({
          tokenHash: this.hashRefreshToken(refreshToken),
        });
        if (storedRefreshToken) {
          await refreshTokenRepo.update(
            {
              familyId: storedRefreshToken.familyId,
              revokedAt: IsNull(),
            },
            { revokedAt: () => 'now()' },
          );
        }
      }
    });
  }

  async refreshToken(refreshToken: string) {
    const refreshTokenRepo = this.ds.getRepository(RefreshToken);
    const storedToken = await refreshTokenRepo.findOneBy({
      tokenHash: this.hashRefreshToken(refreshToken),
    });
    if (!storedToken) {
      throw new NotFoundException('Unknown refresh token');
    }
    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const now = Date.now();
    if (
      now > new Date(storedToken.absoluteExpiresAt).getTime() ||
      now > new Date(storedToken.expiresAt).getTime()
    ) {
      throw new UnauthorizedException('Expired token');
    }
    if (!storedToken.usedAt) {
      await refreshTokenRepo.update(
        { id: storedToken.id, usedAt: IsNull() },
        { usedAt: () => 'now()' },
      );
    } else {
      if (
        storedToken.usedAt &&
        Date.now() - new Date(storedToken.usedAt).getTime() <=
          REFRESH_GRACE_WINDOW_MS
      ) {
        const deadline = Date.now() + Math.min(REFRESH_GRACE_WINDOW_MS, 500);
        for (;;) {
          const cached = await this.cache.get<{
            token: string;
            refreshToken: string;
          }>(`refresh:${storedToken.id}`);
          if (cached)
            return {
              token: cached.token,
              tokenTtl: this.config.get('JWT_TTL_SEC', { infer: true }),
              refreshToken: cached.refreshToken,
              refreshTokenTtl: this.config.get('REFRESH_TOKEN_TTL_SEC', {
                infer: true,
              }),
            };
          if (Date.now() > deadline) break;
          await setTimeout(10);
        }
      }

      await refreshTokenRepo.update(
        {
          familyId: storedToken.familyId,
          revokedAt: IsNull(),
        },
        { revokedAt: () => 'now()' },
      );

      throw new UnauthorizedException('Cannot refresh revoked token');
    }

    const newRefreshToken = randomBytes(32).toString('base64url');
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        tokenHash: this.hashRefreshToken(newRefreshToken),
        familyId: storedToken.familyId,
        userId: storedToken.userId,
        expiresAt: addSeconds(
          now,
          this.config.get('REFRESH_TOKEN_TTL_SEC', {
            infer: true,
          }),
        ).toISOString(),
        absoluteExpiresAt: storedToken.absoluteExpiresAt,
      }),
    );

    const user = await this.ds
      .getRepository(User)
      .findOneBy({ userId: storedToken.userId });
    const newAccessToken = this.jwtService.sign(
      { role: user?.userRole },
      {
        jwtid: uuidV7(),
        subject: storedToken.userId,
      },
    );

    await this.cache.set(
      storedToken.id,
      { token: newAccessToken, refreshToken: newRefreshToken },
      REFRESH_GRACE_WINDOW_MS,
    );

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      tokenTtl: this.config.get('JWT_TTL_SEC', { infer: true }),
      refreshTokenTtl: this.config.get('REFRESH_TOKEN_TTL_SEC', {
        infer: true,
      }),
    };
  }

  async verifyAccessToken(accessToken: string) {
    let verifiedToken: any;
    try {
      verifiedToken = await this.jwtService.verifyAsync(accessToken);
    } catch (err) {
      if (
        err instanceof JsonWebTokenError ||
        err instanceof TokenExpiredError
      ) {
        throw new UnauthorizedException(err.message);
      }
      throw new UnauthorizedException('Cannot verify token');
    }

    const revoked = await this.ds
      .getRepository(DeniedTokens)
      .findOneBy({ iss: verifiedToken.iss, jti: verifiedToken.jti });
    if (revoked) {
      throw new UnauthorizedException('Token is already revoked');
    }

    return verifiedToken;
  }

  hashRefreshToken(token: string) {
    return createHash('sha256')
      .update(this.config.get('REFRESH_TOKEN_PEPPER', { infer: true }))
      .update(token)
      .digest('hex');
  }
}
