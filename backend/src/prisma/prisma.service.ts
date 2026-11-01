import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
// implements OnModuleInit, OnModuleDestroy
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

    super({
      adapter: new PrismaMariaDb(databaseUrl),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  // async onModuleDestroy() {
  //   await this.$disconnect();
  // }
}
