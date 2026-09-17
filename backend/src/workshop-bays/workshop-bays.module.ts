import { Module } from '@nestjs/common';
import { WorkshopBaysService } from './workshop-bays.service';
import { WorkshopBaysController } from './workshop-bays.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkshopBaysController],
  providers: [WorkshopBaysService],
  exports: [WorkshopBaysService],
})
export class WorkshopBaysModule {}
