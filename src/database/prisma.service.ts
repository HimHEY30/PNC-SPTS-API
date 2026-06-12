import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('database.url'),
        },
      },
      log: ['error', 'warn'],
    });

    this.$use(async (params, next) => {
      const SOFT_DELETE_MODELS = [
        'Student',
        'Teacher',
        'AuthUser',
        'FollowUpCase',
      ];
      if (SOFT_DELETE_MODELS.includes(params.model || '')) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = params.args.where || {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else if (params.action === 'findMany') {
          params.args.where = params.args.where || {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else if (params.action === 'count') {
          params.args.where = params.args.where || {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
