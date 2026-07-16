"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MatchingService", {
    enumerable: true,
    get: function() {
        return MatchingService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MatchingService = class MatchingService {
    /**
   * Run matching for a newly created Lost Item
   */ async matchLostItem(lostItem) {
        const activeFoundItems = await this.prisma.foundItem.findMany({
            where: {
                status: 'FOUND'
            }
        });
        const matchesCreated = [];
        for (const foundItem of activeFoundItems){
            const score = this.calculateMatchScore(lostItem, foundItem);
            if (score >= 70) {
                // Check if match already exists
                const existingMatch = await this.prisma.match.findFirst({
                    where: {
                        lostItemId: lostItem.id,
                        foundItemId: foundItem.id
                    }
                });
                if (!existingMatch) {
                    const match = await this.prisma.match.create({
                        data: {
                            lostItemId: lostItem.id,
                            foundItemId: foundItem.id,
                            score,
                            status: 'PENDING'
                        }
                    });
                    matchesCreated.push(match);
                    this.logger.log(`Created match between Lost [${lostItem.title}] and Found [${foundItem.title}] with score ${score}`);
                    // Send WhatsApp Alert
                    this.notificationsService.sendMatchDetectedAlert(score, lostItem.title, foundItem.title).catch((err)=>{
                        this.logger.error('Failed to send match alert:', err);
                    });
                }
            }
        }
        // Update lost item status if high-confidence matches found
        if (matchesCreated.length > 0) {
            await this.prisma.lostItem.update({
                where: {
                    id: lostItem.id
                },
                data: {
                    status: 'MATCHED'
                }
            });
        }
        return matchesCreated;
    }
    /**
   * Run matching for a newly created Found Item
   */ async matchFoundItem(foundItem) {
        const activeLostItems = await this.prisma.lostItem.findMany({
            where: {
                status: 'LOST'
            }
        });
        const matchesCreated = [];
        for (const lostItem of activeLostItems){
            const score = this.calculateMatchScore(lostItem, foundItem);
            if (score >= 70) {
                const existingMatch = await this.prisma.match.findFirst({
                    where: {
                        lostItemId: lostItem.id,
                        foundItemId: foundItem.id
                    }
                });
                if (!existingMatch) {
                    const match = await this.prisma.match.create({
                        data: {
                            lostItemId: lostItem.id,
                            foundItemId: foundItem.id,
                            score,
                            status: 'PENDING'
                        }
                    });
                    matchesCreated.push(match);
                    this.logger.log(`Created match between Found [${foundItem.title}] and Lost [${lostItem.title}] with score ${score}`);
                    // Send WhatsApp Alert
                    this.notificationsService.sendMatchDetectedAlert(score, lostItem.title, foundItem.title).catch((err)=>{
                        this.logger.error('Failed to send match alert:', err);
                    });
                }
            }
        }
        if (matchesCreated.length > 0) {
            await this.prisma.foundItem.update({
                where: {
                    id: foundItem.id
                },
                data: {
                    status: 'MATCHED'
                }
            });
        }
        return matchesCreated;
    }
    /**
   * Core Scoring Engine
   * Calculates a match score from 0 to 100
   */ calculateMatchScore(lost, found) {
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
        } else if (locLost.includes(locFound) || locFound.includes(locLost) || this.areLocationsNear(locLost, locFound)) {
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
        const keywordScore = this.calculateKeywordSimilarity(`${lost.title} ${lost.description}`, `${found.title} ${found.description}`);
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
   */ areLocationsNear(loc1, loc2) {
        const campusZones = [
            [
                'library',
                'study hall',
                'reading room'
            ],
            [
                'cafeteria',
                'canteen',
                'food court',
                'mess'
            ],
            [
                'sports complex',
                'gym',
                'football field',
                'stadium',
                'ground'
            ],
            [
                'engineering block',
                'lab',
                'computer center',
                'it department'
            ],
            [
                'hostel',
                'dorm',
                'residential hall'
            ],
            [
                'administration',
                'admission office',
                'main block'
            ]
        ];
        for (const zone of campusZones){
            const matchesLoc1 = zone.some((keyword)=>loc1.includes(keyword));
            const matchesLoc2 = zone.some((keyword)=>loc2.includes(keyword));
            if (matchesLoc1 && matchesLoc2) return true;
        }
        return false;
    }
    /**
   * Helper: Calculates Jaccard similarity of word tokens
   */ calculateKeywordSimilarity(str1, str2) {
        const stopWords = new Set([
            'a',
            'an',
            'the',
            'is',
            'at',
            'in',
            'on',
            'with',
            'and',
            'or',
            'of',
            'for',
            'to',
            'was',
            'my',
            'i',
            'found',
            'lost'
        ]);
        const tokenize = (text)=>{
            return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/).filter((word)=>word.length > 1 && !stopWords.has(word));
        };
        const tokens1 = new Set(tokenize(str1));
        const tokens2 = new Set(tokenize(str2));
        if (tokens1.size === 0 || tokens2.size === 0) return 0;
        const intersection = new Set([
            ...tokens1
        ].filter((x)=>tokens2.has(x)));
        const union = new Set([
            ...tokens1,
            ...tokens2
        ]);
        return intersection.size / union.size;
    }
    /**
   * Helper: Calculates similarity between two fingerprints
   * e.g., "HP-BLACK-15IN-STICKER" vs "HP-DARKGRAY-15IN"
   */ calculateFingerprintSimilarity(fp1, fp2) {
        const parts1 = fp1.toUpperCase().split('-');
        const parts2 = fp2.toUpperCase().split('-');
        if (parts1.length === 0 || parts2.length === 0) return 0;
        // Direct comparison of parts
        let matches = 0;
        const maxLen = Math.max(parts1.length, parts2.length);
        for(let i = 0; i < Math.min(parts1.length, parts2.length); i++){
            if (parts1[i] === parts2[i] || parts1[i].includes(parts2[i]) || parts2[i].includes(parts1[i])) {
                matches++;
            }
        }
        return matches / maxLen;
    }
    /**
   * Fetch matches for a specific user (either owner or finder)
   */ async getUserMatches(userId) {
        return this.prisma.match.findMany({
            where: {
                OR: [
                    {
                        lostItem: {
                            ownerId: userId
                        }
                    },
                    {
                        foundItem: {
                            finderId: userId
                        }
                    }
                ]
            },
            include: {
                lostItem: {
                    include: {
                        owner: true
                    }
                },
                foundItem: {
                    include: {
                        finder: true
                    }
                },
                claims: true
            },
            orderBy: {
                score: 'desc'
            }
        });
    }
    /**
   * Fetch all active matches
   */ async findAllMatches() {
        return this.prisma.match.findMany({
            include: {
                lostItem: {
                    include: {
                        owner: true
                    }
                },
                foundItem: {
                    include: {
                        finder: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    constructor(prisma, notificationsService){
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.logger = new _common.Logger(MatchingService.name);
    }
};
MatchingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService
    ])
], MatchingService);

//# sourceMappingURL=matching.service.js.map