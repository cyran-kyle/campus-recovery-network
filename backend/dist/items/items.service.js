"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ItemsService", {
    enumerable: true,
    get: function() {
        return ItemsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _matchingservice = require("../matching/matching.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ItemsService = class ItemsService {
    /**
   * Create a fingerprint string from structured item characteristics
   */ generateFingerprint(data) {
        const clean = (val)=>val ? val.trim().toUpperCase().replace(/\s+/g, '') : 'ANY';
        const category = clean(data.category);
        const brand = clean(data.brand);
        const color = clean(data.color);
        const size = clean(data.size);
        const unique = clean(data.uniqueFeatures);
        return `${category}-${brand}-${color}-${size}-${unique}`;
    }
    async createLostItem(ownerId, data) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: ownerId
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${ownerId} not found`);
        }
        const fingerprint = this.generateFingerprint({
            category: data.category,
            brand: data.brand,
            color: data.color,
            size: data.size,
            uniqueFeatures: data.uniqueFeatures
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
                fingerprint
            }
        });
        // Run matching asynchronously
        this.matchingService.matchLostItem(lostItem).catch((err)=>{
            console.error('Error matching lost item:', err);
        });
        return lostItem;
    }
    async createFoundItem(finderId, data) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: finderId
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${finderId} not found`);
        }
        const fingerprint = this.generateFingerprint({
            category: data.category,
            brand: data.brand,
            color: data.color,
            size: data.size,
            uniqueFeatures: data.uniqueFeatures
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
                secretQuestions: data.secretQuestions || []
            }
        });
        // Run matching asynchronously
        this.matchingService.matchFoundItem(foundItem).catch((err)=>{
            console.error('Error matching found item:', err);
        });
        return foundItem;
    }
    async findLostItems() {
        return this.prisma.lostItem.findMany({
            include: {
                owner: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findFoundItems() {
        return this.prisma.foundItem.findMany({
            include: {
                finder: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findOneLost(id) {
        const item = await this.prisma.lostItem.findUnique({
            where: {
                id
            },
            include: {
                owner: true,
                matches: {
                    include: {
                        foundItem: true
                    }
                }
            }
        });
        if (!item) {
            throw new _common.NotFoundException(`Lost item with ID ${id} not found`);
        }
        return item;
    }
    async findOneFound(id) {
        const item = await this.prisma.foundItem.findUnique({
            where: {
                id
            },
            include: {
                finder: true,
                matches: {
                    include: {
                        lostItem: true
                    }
                }
            }
        });
        if (!item) {
            throw new _common.NotFoundException(`Found item with ID ${id} not found`);
        }
        return item;
    }
    async deleteLost(id) {
        return this.prisma.lostItem.delete({
            where: {
                id
            }
        });
    }
    async deleteFound(id) {
        return this.prisma.foundItem.delete({
            where: {
                id
            }
        });
    }
    constructor(prisma, matchingService){
        this.prisma = prisma;
        this.matchingService = matchingService;
    }
};
ItemsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _matchingservice.MatchingService === "undefined" ? Object : _matchingservice.MatchingService
    ])
], ItemsService);

//# sourceMappingURL=items.service.js.map