import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.usersService.register(body);
  }

  @Post('login')
  async login(@Body() body: { studentId: string; password: any }) {
    return this.usersService.login(body.studentId, body.password);
  }

  @Post(':id/verify')
  async verifyUser(@Param('id') id: string) {
    return this.usersService.verifyUser(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('persona')
  async getOrCreatePersona(
    @Body() body: { studentId: string; name: string; email: string; role?: string },
  ) {
    return this.usersService.findOrCreate(
      body.studentId,
      body.name,
      body.email,
      body.role || 'USER',
    );
  }

  @Post(':id/trust')
  async updateTrust(
    @Param('id') id: string,
    @Body() body: { scoreChange: number; reason: string },
  ) {
    return this.usersService.updateTrustScore(id, body.scoreChange, body.reason);
  }
}
