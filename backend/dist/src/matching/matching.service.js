"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MatchingService = MatchingService_1 = class MatchingService {
    prisma;
    logger = new common_1.Logger(MatchingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async matchLostItem(lostItem) {
        const activeFoundItems = await this.prisma.foundItem.findMany({
            where: { status: 'FOUND' },
        });
        const matchesCreated = [];
        for (const foundItem of activeFoundItems) {
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
                    this.logger.log(`Created match between Lost [${lostItem.title}] and Found [${foundItem.title}] with score ${score}`);
                }
            }
        }
        if (matchesCreated.length > 0) {
            await this.prisma.lostItem.update({
                where: { id: lostItem.id },
                data: { status: 'MATCHED' },
            });
        }
        return matchesCreated;
    }
    async matchFoundItem(foundItem) {
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
    calculateMatchScore(lost, found) {
        let score = 0;
        if (lost.category.trim().toLowerCase() === found.category.trim().toLowerCase()) {
            score += 30;
        }
        const locLost = lost.locationLost.trim().toLowerCase();
        const locFound = found.locationFound.trim().toLowerCase();
        if (locLost === locFound) {
            score += 20;
        }
        else if (locLost.includes(locFound) ||
            locFound.includes(locLost) ||
            this.areLocationsNear(locLost, locFound)) {
            score += 12;
        }
        const diffTime = Math.abs(lost.dateLost.getTime() - found.dateFound.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            score += 15;
        }
        else if (diffDays <= 3) {
            score += 10;
        }
        else if (diffDays <= 7) {
            score += 5;
        }
        const keywordScore = this.calculateKeywordSimilarity(`${lost.title} ${lost.description}`, `${found.title} ${found.description}`);
        score += Math.min(20, Math.round(keywordScore * 20));
        if (lost.fingerprint && found.fingerprint) {
            const fpSimilarity = this.calculateFingerprintSimilarity(lost.fingerprint, found.fingerprint);
            score += Math.round(fpSimilarity * 10);
        }
        if (lost.imageUrl && found.imageUrl) {
            const imageSim = keywordScore > 0.5 ? 5 : 3;
            score += imageSim;
        }
        else if (!lost.imageUrl && !found.imageUrl) {
            score += 2;
        }
        return Math.min(100, score);
    }
    areLocationsNear(loc1, loc2) {
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
            if (matchesLoc1 && matchesLoc2)
                return true;
        }
        return false;
    }
    calculateKeywordSimilarity(str1, str2) {
        const stopWords = new Set(['a', 'an', 'the', 'is', 'at', 'in', 'on', 'with', 'and', 'or', 'of', 'for', 'to', 'was', 'my', 'i', 'found', 'lost']);
        const tokenize = (text) => {
            return text
                .toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 1 && !stopWords.has(word));
        };
        const tokens1 = new Set(tokenize(str1));
        const tokens2 = new Set(tokenize(str2));
        if (tokens1.size === 0 || tokens2.size === 0)
            return 0;
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        return intersection.size / union.size;
    }
    calculateFingerprintSimilarity(fp1, fp2) {
        const parts1 = fp1.toUpperCase().split('-');
        const parts2 = fp2.toUpperCase().split('-');
        if (parts1.length === 0 || parts2.length === 0)
            return 0;
        let matches = 0;
        const maxLen = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
            if (parts1[i] === parts2[i] || parts1[i].includes(parts2[i]) || parts2[i].includes(parts1[i])) {
                matches++;
            }
        }
        return matches / maxLen;
    }
    async getUserMatches(userId) {
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
    async findAllMatches() {
        return this.prisma.match.findMany({
            include: {
                lostItem: { include: { owner: true } },
                foundItem: { include: { finder: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map