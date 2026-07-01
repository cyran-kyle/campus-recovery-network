import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LostItem, FoundItem } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run matching for a newly created Lost Item
   */
  async matchLostItem(lostItem: LostItem) {
    const activeFoundItems = await this.prisma.foundItem.findMany({
      where: { status: 'FOUND' },
    });

    const matchesCreated = [];

    for (const foundItem of activeFoundItems) {
      const score = this.calculateMatchScore(lostItem, foundItem);
      if (score >= 70) {
        // Check if match already exists
        const existingMatch = await this.prisma.match.findFirst({
          where: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
          },
        });

        if (!existingMatch) {
          const match = await this.prisma.match.create({
            data: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
              score,
              status: 'PENDING',
            },
          });
          matchesCreated.push(match);
          this.logger.log(`Created match between Lost [${lostItem.title}] and Found [${foundItem.title}] with score ${score}`);
        }
      }
    }

    // Update lost item status if high-confidence matches found
    if (matchesCreated.length > 0) {
      await this.prisma.lostItem.update({
        where: { id: lostItem.id },
        data: { status: 'MATCHED' },
      });
    }

    return matchesCreated;
  }

  /**
   * Run matching for a newly created Found Item
   */
  async matchFoundItem(foundItem: FoundItem) {
    const activeLostItems = await this.prisma.lostItem.findMany({
      where: { status: 'LOST' },
    });

    const matchesCreated = [];

    for (const lostItem of activeLostItems) {
      const score = this.calculateMatchScore(lostItem, foundItem);
      if (score >= 70) {
        const existingMatch = await this.prisma.match.findFirst({
          where: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
          },
        });

        if (!existingMatch) {
          const match = await this.prisma.match.create({
            data: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
              score,
              status: 'PENDING',
            },
          });
          matchesCreated.push(match);
          this.logger.log(`Created match between Found [${foundItem.title}] and Lost [${lostItem.title}] with score ${score}`);
        }
      }
    }

    if (matchesCreated.length > 0) {
      await this.prisma.foundItem.update({
        where: { id: foundItem.id },
        data: { status: 'MATCHED' },
      });
    }

    return matchesCreated;
  }

  /**
   * Core Scoring Engine
   * Calculates a match score from 0 to 100
   */
  calculateMatchScore(lost: LostItem, found: FoundItem): number {
    let score = 0;

    // 1. Category Match (30 Points)
    if (lost.category.trim().toLowerCase() === found.category.trim().toLowerCase()) {
      score += 30;
    }

    // 2. Location Match (20 Points)
    const locLost = lost.locationLost.trim().toLowerCase();
    const locFound = found.locationFound.trim().toLowerCase();
    if (locLost === locFound) {
      score += 20;
    } else if (
      locLost.includes(locFound) || 
      locFound.includes(locLost) ||
      this.areLocationsNear(locLost, locFound)
    ) {
      score += 12; // Partial location match
    }

    // 3. Date Match (15 Points)
    const diffTime = Math.abs(lost.dateLost.getTime() - found.dateFound.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      score += 15;
    } else if (diffDays <= 3) {
      score += 10;
    } else if (diffDays <= 7) {
      score += 5;
    }

    // 4. Keyword / Description Overlap (20 Points)
    const keywordScore = this.calculateKeywordSimilarity(
      `${lost.title} ${lost.description}`,
      `${found.title} ${found.description}`
    );
    score += Math.min(20, Math.round(keywordScore * 20));

    // 5. Item Fingerprint Similarity (10 Points)
    if (lost.fingerprint && found.fingerprint) {
      const fpSimilarity = this.calculateFingerprintSimilarity(lost.fingerprint, found.fingerprint);
      score += Math.round(fpSimilarity * 10);
    }

    // 6. Image Similarity Simulation (5 Points)
    if (lost.imageUrl && found.imageUrl) {
      // Simulate image resemblance: higher if keyword overlap is high
      const imageSim = keywordScore > 0.5 ? 5 : 3;
      score += imageSim;
    } else if (!lost.imageUrl && !found.imageUrl) {
      // If neither has an image, grant a neutral 2-point boost to avoid penalizing non-photo reports
      score += 2;
    }

    return Math.min(100, score);
  }

  /**
   * Helper: Check if two campus locations are close
   */
  private areLocationsNear(loc1: string, loc2: string): boolean {
    const campusZones = [
      ['library', 'study hall', 'reading room'],
      ['cafeteria', 'canteen', 'food court', 'mess'],
      ['sports complex', 'gym', 'football field', 'stadium', 'ground'],
      ['engineering block', 'lab', 'computer center', 'it department'],
      ['hostel', 'dorm', 'residential hall'],
      ['administration', 'admission office', 'main block'],
    ];

    for (const zone of campusZones) {
      const matchesLoc1 = zone.some(keyword => loc1.includes(keyword));
      const matchesLoc2 = zone.some(keyword => loc2.includes(keyword));
      if (matchesLoc1 && matchesLoc2) return true;
    }

    return false;
  }

  /**
   * Helper: Calculates Jaccard similarity of word tokens
   */
  private calculateKeywordSimilarity(str1: string, str2: string): number {
    const stopWords = new Set(['a', 'an', 'the', 'is', 'at', 'in', 'on', 'with', 'and', 'or', 'of', 'for', 'to', 'was', 'my', 'i', 'found', 'lost']);
    
    const tokenize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.has(word));
    };

    const tokens1 = new Set(tokenize(str1));
    const tokens2 = new Set(tokenize(str2));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Helper: Calculates similarity between two fingerprints
   * e.g., "HP-BLACK-15IN-STICKER" vs "HP-DARKGRAY-15IN"
   */
  private calculateFingerprintSimilarity(fp1: string, fp2: string): number {
    const parts1 = fp1.toUpperCase().split('-');
    const parts2 = fp2.toUpperCase().split('-');

    if (parts1.length === 0 || parts2.length === 0) return 0;

    // Direct comparison of parts
    let matches = 0;
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i] || parts1[i].includes(parts2[i]) || parts2[i].includes(parts1[i])) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Fetch matches for a specific user (either owner or finder)
   */
  async getUserMatches(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [
          { lostItem: { ownerId: userId } },
          { foundItem: { finderId: userId } },
        ],
      },
      include: {
        lostItem: {
          include: { owner: true },
        },
        foundItem: {
          include: { finder: true },
        },
        claims: true,
      },
      orderBy: { score: 'desc' },
    });
  }

  /**
   * Fetch all active matches
   */
  async findAllMatches() {
    return this.prisma.match.findMany({
      include: {
        lostItem: { include: { owner: true } },
        foundItem: { include: { finder: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
