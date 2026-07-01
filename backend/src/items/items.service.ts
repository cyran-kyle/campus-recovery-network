import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService,
  ) {}

  /**
   * Create a fingerprint string from structured item characteristics
   */
  generateFingerprint(data: {
    category: string;
    brand?: string;
    color?: string;
    size?: string;
    uniqueFeatures?: string;
  }): string {
    const clean = (val?: string) => (val ? val.trim().toUpperCase().replace(/\s+/g, '') : 'ANY');
    const category = clean(data.category);
    const brand = clean(data.brand);
    const color = clean(data.color);
    const size = clean(data.size);
    const unique = clean(data.uniqueFeatures);

    return `${category}-${brand}-${color}-${size}-${unique}`;
  }

  async createLostItem(ownerId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${ownerId} not found`);
    }

    const fingerprint = this.generateFingerprint({
      category: data.category,
      brand: data.brand,
      color: data.color,
      size: data.size,
      uniqueFeatures: data.uniqueFeatures,
    });

    const lostItem = await this.prisma.lostItem.create({
      data: {
        ownerId,
        title: data.title,
        description: data.description,
        category: data.category,
        locationLost: data.locationLost,
        dateLost: new Date(data.dateLost),
        imageUrl: data.imageUrl,
        status: 'LOST',
        fingerprint,
      },
    });

    // Run matching asynchronously
    this.matchingService.matchLostItem(lostItem).catch((err) => {
      console.error('Error matching lost item:', err);
    });

    return lostItem;
  }

  async createFoundItem(finderId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: finderId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${finderId} not found`);
    }

    const fingerprint = this.generateFingerprint({
      category: data.category,
      brand: data.brand,
      color: data.color,
      size: data.size,
      uniqueFeatures: data.uniqueFeatures,
    });

    const foundItem = await this.prisma.foundItem.create({
      data: {
        finderId,
        title: data.title,
        description: data.description,
        category: data.category,
        locationFound: data.locationFound,
        dateFound: new Date(data.dateFound),
        imageUrl: data.imageUrl,
        status: 'FOUND',
        fingerprint,
        secretQuestions: data.secretQuestions || [],
      },
    });

    // Run matching asynchronously
    this.matchingService.matchFoundItem(foundItem).catch((err) => {
      console.error('Error matching found item:', err);
    });

    return foundItem;
  }

  async findLostItems() {
    return this.prisma.lostItem.findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFoundItems() {
    return this.prisma.foundItem.findMany({
      include: { finder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLost(id: string) {
    const item = await this.prisma.lostItem.findUnique({
      where: { id },
      include: { owner: true, matches: { include: { foundItem: true } } },
    });
    if (!item) {
      throw new NotFoundException(`Lost item with ID ${id} not found`);
    }
    return item;
  }

  async findOneFound(id: string) {
    const item = await this.prisma.foundItem.findUnique({
      where: { id },
      include: { finder: true, matches: { include: { lostItem: true } } },
    });
    if (!item) {
      throw new NotFoundException(`Found item with ID ${id} not found`);
    }
    return item;
  }

  async deleteLost(id: string) {
    return this.prisma.lostItem.delete({ where: { id } });
  }

  async deleteFound(id: string) {
    return this.prisma.foundItem.delete({ where: { id } });
  }
}
