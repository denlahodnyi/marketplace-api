import type { Response, Request } from 'express';

import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';

import { LoginDto, LoginUserResponse } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { IsPublic } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: LoginUserResponse })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() loginBody: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginBody.email);
    res.cookie('accessToken', result.token, {
      sameSite: 'lax',
      maxAge: result.tokenTtl * 1000,
      path: '/',
      // TODO: add HTTPOnly, Secure
    });
    res.cookie('__Host-refreshToken', result.refreshToken, {
      sameSite: 'lax',
      maxAge: result.refreshTokenTtl * 1000,
      path: '/',
      // TODO: add HTTPOnly, Secure
    });

    return result.user;
  }

  @HttpCode(204)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      request.cookies.accessToken,
      request.cookies['__Host-refreshToken'],
    );
    response.clearCookie('accessToken');
    response.clearCookie('__Host-refreshToken');
  }

  @HttpCode(200)
  @Post('refresh')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request.cookies['__Host-refreshToken']) {
      throw new UnauthorizedException('Refresh token was not found');
    }
    const result = await this.authService.refreshToken(
      request.cookies['__Host-refreshToken'],
    );
    response.cookie('accessToken', result.token, {
      sameSite: 'lax',
      maxAge: result.tokenTtl * 1000,
      path: '/',
      // TODO: add HTTPOnly, Secure
    });
    response.cookie('__Host-refreshToken', result.refreshToken, {
      sameSite: 'lax',
      maxAge: result.refreshTokenTtl * 1000,
      path: '/',
      // TODO: add HTTPOnly, Secure
    });
    return { success: true };
  }
}
