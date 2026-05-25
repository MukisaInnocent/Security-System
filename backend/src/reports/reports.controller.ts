import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('generate-daily')
  async generateDaily(@Body() body: { date?: string; siteId?: string; regionId?: string }) {
    const date = body.date || new Date().toISOString().split('T')[0];
    return this.reportsService.generateDailyCoverage(date, body.siteId, body.regionId);
  }

  @Post('generate-night-shift')
  async generateNightShift(@Body() body: { date?: string }) {
    const date = body.date || new Date().toISOString().split('T')[0];
    return this.reportsService.generateNightShiftReport(date);
  }

  @Get('coverage')
  async getCoverage(@Query('date') date?: string, @Query('siteId') siteId?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.reportsService.generateDailyCoverage(reportDate, siteId);
  }

  @Get('call-card')
  async getCallCard(@Query('date') date?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.reportsService.getCallCard(reportDate);
  }

  @Get('absent-guards')
  async getAbsentGuards(@Query('date') date?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.reportsService.getAbsentGuards(reportDate);
  }

  @Post(':id/send')
  async sendReport(@Param('id') id: string, @Body() body: { recipientIds: string[] }) {
    return this.reportsService.sendReport(id, body.recipientIds);
  }

  @Get()
  async listReports(@Query('type') type?: string, @Query('limit') limit?: string) {
    return this.reportsService.getReports(type, limit ? parseInt(limit) : 50);
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }
}
