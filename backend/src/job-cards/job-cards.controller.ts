import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { JobCardsService } from './job-cards.service';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { UpdateJobCardDto } from './dto/update-job-card.dto';

@Controller('job-cards')
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Post()
  create(@Body() createJobCardDto: CreateJobCardDto) {
    return this.jobCardsService.create(createJobCardDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.jobCardsService.findAll(
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobCardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobCardDto: UpdateJobCardDto) {
    return this.jobCardsService.update(id, updateJobCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobCardsService.remove(id);
  }
}
