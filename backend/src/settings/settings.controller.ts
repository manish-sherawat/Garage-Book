import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Post()
  async updateSettings(@Body() data: Record<string, any>) {
    return this.settingsService.updateSettings(data);
  }
}
