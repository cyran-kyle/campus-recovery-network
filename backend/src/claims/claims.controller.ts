import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post(':claimantId')
  async createClaim(
    @Param('claimantId') claimantId: string,
    @Body() body: { matchId: string; answers: any[] },
  ) {
    return this.claimsService.createClaim(claimantId, body.matchId, body.answers);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return this.claimsService.approveClaim(id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.claimsService.rejectClaim(id, body?.reason || 'Incorrect answers');
  }

  @Get()
  async findAll() {
    return this.claimsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Delete(':id')
  async deleteClaim(@Param('id') id: string) {
    return this.claimsService.deleteClaim(id);
  }
}
