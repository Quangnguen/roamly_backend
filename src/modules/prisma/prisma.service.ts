/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async destroy() {
    await this.$disconnect();
  }
}
