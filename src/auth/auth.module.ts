import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { createPrivateKey, createPublicKey } from 'node:crypto';

import type { Env } from '../config/index.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Env, true>) => {
        const privateKey = createPrivateKey(
          Buffer.from(
            configService.get('JWT_PRIVATE_KEY', { infer: true }),
            'base64',
          ),
        );
        const publicKey = createPublicKey(
          Buffer.from(
            configService.get('JWT_PUBLIC_KEY', { infer: true }),
            'base64',
          ),
        );
        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'ES256',
            issuer: 'marketplace-auth',
            audience: 'marketplace-api',
            expiresIn: configService.get('JWT_TTL_SEC', { infer: true }),
            keyid: configService.get('JWT_KID', { infer: true }),
          },
          verifyOptions: {
            algorithms: ['ES256'],
            issuer: 'marketplace-auth',
            audience: 'marketplace-api',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
