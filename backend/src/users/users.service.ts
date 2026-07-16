import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { trustScore: 'desc' },
      include: {
        _count: {
          select: { lostItems: true, foundItems: true, claims: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        trustLogs: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { lostItems: true, foundItems: true, claims: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async register(data: {
    studentId: string;
    name: string;
    course: string;
    sex: string;
    photo: string;
    password: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        studentId: {
          equals: data.studentId,
          mode: 'insensitive',
        },
      },
    });
    if (existingUser) {
      throw new BadRequestException(`User with ID number ${data.studentId} already exists`);
    }

    const user = await this.prisma.user.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        course: data.course,
        sex: data.sex,
        photo: data.photo,
        password: data.password,
        role: 'USER',
        isVerified: false,
        trustScore: 100,
      },
    });

    // Log initial trust points
    await this.prisma.trustLog.create({
      data: {
        userId: user.id,
        scoreChange: 100,
        reason: 'Account creation registration bonus',
      },
    });

    // Send WhatsApp Alert
    this.notificationsService.sendUserRegisteredAlert(user).catch(err => {
      console.error('Failed to send registration alert:', err);
    });

    return this.findOne(user.id);
  }

  async login(studentId: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        studentId: {
          equals: studentId,
          mode: 'insensitive',
        },
      },
    });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid ID number or password');
    }

    return this.findOne(user.id);
  }

  async verifyUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });

    return this.findOne(id);
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findOrCreate(studentId: string, name: string, email: string, role = 'USER') {
    let user = await this.prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          studentId,
          name,
          email,
          role,
          password: 'Password123', // Fallback default password
          isVerified: true,
          trustScore: 100,
        },
      });
      
      // Log initial trust points
      await this.prisma.trustLog.create({
        data: {
          userId: user.id,
          scoreChange: 100,
          reason: 'Account creation registration bonus',
        },
      });

      // Send WhatsApp Alert
      this.notificationsService.sendUserRegisteredAlert(user).catch(err => {
        console.error('Failed to send registration alert:', err);
      });
    }

    return this.findOne(user.id);
  }

  async updateTrustScore(userId: string, scoreChange: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newScore = Math.max(0, user.trustScore + scoreChange);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { trustScore: newScore },
      }),
      this.prisma.trustLog.create({
        data: {
          userId,
          scoreChange,
          reason,
        },
      }),
    ]);

    return this.findOne(userId);
  }
}
