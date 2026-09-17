import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { WorkshopBaysService, CreateBayDto, AllocateBayDto, BayStatus } from './workshop-bays.service';

@Controller('workshop-bays')
export class WorkshopBaysController {
  constructor(private readonly baysService: WorkshopBaysService) {}

  @Get()
  getAllBays() {
    return this.baysService.getAllBays();
  }

  @Post()
  createBay(@Body() dto: CreateBayDto) {
    return this.baysService.createBay(dto);
  }

  @Post('allocate')
  allocateBay(@Body() dto: AllocateBayDto) {
    return this.baysService.allocateBay(dto);
  }

  @Post(':id/release')
  releaseBay(@Param('id') id: string) {
    return this.baysService.releaseBay(id);
  }

  @Patch(':id/status')
  updateBayStatus(@Param('id') id: string, @Body('status') status: BayStatus) {
    return this.baysService.updateBayStatus(id, status);
  }
}
