import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';

type AuthenticatedRequest = Request & { userId: string };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signup(dto);
    this.setAuthCookie(response, result.token, false);
    return { user: result.user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookie(response, result.token, dto.rememberMe === true);
    return { user: result.user };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.authService.getPublicUser(request.userId);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, this.cookieOptions());
    return { success: true };
  }

  private setAuthCookie(
    response: Response,
    token: string,
    rememberMe: boolean,
  ) {
    const options = this.cookieOptions();

    if (rememberMe) {
      options.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    response.cookie(AUTH_COOKIE, token, options);
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.configService.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: undefined as number | undefined,
    };
  }
}
