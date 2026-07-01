import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('lost/:ownerId')
  async createLost(@Param('ownerId') ownerId: string, @Body() body: any) {
    return this.itemsService.createLostItem(ownerId, body);
  }

  @Post('found/:finderId')
  async createFound(@Param('finderId') finderId: string, @Body() body: any) {
    return this.itemsService.createFoundItem(finderId, body);
  }

  @Get('lost')
  async findLost() {
    return this.itemsService.findLostItems();
  }

  @Get('found')
  async findFound() {
    return this.itemsService.findFoundItems();
  }

  @Get('lost/:id')
  async findOneLost(@Param('id') id: string) {
    return this.itemsService.findOneLost(id);
  }

  @Get('found/:id')
  async findOneFound(@Param('id') id: string) {
    return this.itemsService.findOneFound(id);
  }

  @Delete('lost/:id')
  async deleteLost(@Param('id') id: string) {
    return this.itemsService.deleteLost(id);
  }

  @Delete('found/:id')
  async deleteFound(@Param('id') id: string) {
    return this.itemsService.deleteFound(id);
  }
}
