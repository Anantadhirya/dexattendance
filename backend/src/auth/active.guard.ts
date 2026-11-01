import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class ActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('This account is inactive');
    }

    return true;
  }
}
