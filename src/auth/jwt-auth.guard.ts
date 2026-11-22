import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity.js';
import { AuthService } from './auth.service.js';
import { IsPublic } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IsPublic, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies.accessToken;
    if (!token) throw new UnauthorizedException('Token was not found');

    const verifiedToken = await this.authService.verifyAccessToken(token);
    const user = await this.userRepo.findOneBy({ userId: verifiedToken.sub });
    if (!user) return false;
    request.user = { userId: verifiedToken.sub, role: user.userRole };
    return true;
  }
}
