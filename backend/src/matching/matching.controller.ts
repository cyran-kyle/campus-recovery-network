import { Controller, Get, Param } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matches')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  async findAll() {
    return this.matchingService.findAllMatches();
  }

  @Get('user/:userId')
  async getUserMatches(@Param('userId') userId: string) {
    return this.matchingService.getUserMatches(userId);
  }
}
