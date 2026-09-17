import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

function getDbUrl() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (match) return match[1];
  } catch (e) {}
  return process.env.DATABASE_URL;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: getDbUrl(),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database via Prisma.');
    } catch (error) {
      this.logger.warn(
        'Database connection failed. Starting backend API in offline fallback mode.',
      );
      console.error(error);
    }
  }
}
