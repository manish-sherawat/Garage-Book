import { Controller, Get, Post, Put, Patch, Body, Delete, Param } from '@nestjs/common';
import { MechanicsService } from './mechanics.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';

@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Get()
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mechanicsService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.mechanicsService.update(id, dto);
  }

  @Put('attendance')
  saveAttendance(@Body() body: { date: string, attendanceData: Record<string, string> }) {
    return this.mechanicsService.saveAttendance(body.date, body.attendanceData);
  }
}
