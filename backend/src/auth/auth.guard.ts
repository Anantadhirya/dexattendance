import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_COOKIE } from './auth.constants.js';

type AuthenticatedRequest = Request & { userId?: string };

function getCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const cookie = cookies.find((value) => value.trim().startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.trim().slice(name.length + 1))
    : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = getCookie(request, AUTH_COOKIE);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
