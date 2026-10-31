import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;

    if (!userId) {
      throw new ForbiddenException('Administrator access required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, isActive: true },
    });

    if (!user?.isAdmin || !user.isActive) {
      throw new ForbiddenException('Administrator access required');
    }

    return true;
  }
}
