"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AnalyticsService", {
    enumerable: true,
    get: function() {
        return AnalyticsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AnalyticsService = class AnalyticsService {
    async getDashboardStats() {
        // 1. Total Lost & Found
        const totalLost = await this.prisma.lostItem.count();
        const totalFound = await this.prisma.foundItem.count();
        // 2. Recovered Items (status = RETURNED)
        const recoveredLost = await this.prisma.lostItem.count({
            where: {
                status: 'RETURNED'
            }
        });
        const activeLost = await this.prisma.lostItem.count({
            where: {
                status: 'LOST'
            }
        });
        const activeFound = await this.prisma.foundItem.count({
            where: {
                status: 'FOUND'
            }
        });
        // 3. Recovery Rate
        const recoveryRate = totalLost > 0 ? Math.round(recoveredLost / totalLost * 100) : 0;
        // 4. Calculate Average Recovery Time in hours
        const returnedClaims = await this.prisma.claim.findMany({
            where: {
                status: 'APPROVED'
            },
            include: {
                match: {
                    include: {
                        lostItem: true
                    }
                }
            }
        });
        let avgRecoveryHours = 0;
        if (returnedClaims.length > 0) {
            const totalHours = returnedClaims.reduce((sum, claim)=>{
                const lostTime = claim.match.lostItem.createdAt.getTime();
                const returnTime = claim.createdAt.getTime();
                return sum + (returnTime - lostTime) / (1000 * 60 * 60);
            }, 0);
            avgRecoveryHours = Math.round(totalHours / returnedClaims.length);
        } else {
            avgRecoveryHours = 4.5; // Baseline default for display if empty
        }
        // 5. Category Breakdown
        const lostItems = await this.prisma.lostItem.findMany();
        const categories = {};
        for (const item of lostItems){
            const cat = item.category || 'Other';
            if (!categories[cat]) {
                categories[cat] = {
                    lost: 0,
                    recovered: 0
                };
            }
            categories[cat].lost++;
            if (item.status === 'RETURNED') {
                categories[cat].recovered++;
            }
        }
        const categoryBreakdown = Object.entries(categories).map(([name, stats])=>({
                name,
                lost: stats.lost,
                recovered: stats.recovered
            }));
        // 6. Campus Zones & Heatmap data
        // Coordinates representing zones on a standard campus layout
        const zoneDefinitions = {
            'Library': {
                x: 35,
                y: 30,
                color: 'rgba(239, 68, 68, 0.6)'
            },
            'Cafeteria': {
                x: 65,
                y: 45,
                color: 'rgba(245, 158, 11, 0.6)'
            },
            'Sports Complex': {
                x: 20,
                y: 70,
                color: 'rgba(16, 185, 129, 0.6)'
            },
            'Engineering Block': {
                x: 50,
                y: 20,
                color: 'rgba(59, 130, 246, 0.6)'
            },
            'Hostels': {
                x: 80,
                y: 75,
                color: 'rgba(139, 92, 246, 0.6)'
            },
            'Administration': {
                x: 45,
                y: 55,
                color: 'rgba(236, 72, 153, 0.6)'
            }
        };
        const allLost = await this.prisma.lostItem.findMany();
        const allFound = await this.prisma.foundItem.findMany();
        const zoneStats = {};
        // Initialize
        Object.entries(zoneDefinitions).forEach(([name, coords])=>{
            zoneStats[name] = {
                name,
                lost: 0,
                found: 0,
                recovered: 0,
                x: coords.x,
                y: coords.y,
                density: 0
            };
        });
        // Populate from LostItems
        allLost.forEach((item)=>{
            const zone = this.normalizeZone(item.locationLost);
            if (zoneStats[zone]) {
                zoneStats[zone].lost++;
                if (item.status === 'RETURNED') {
                    zoneStats[zone].recovered++;
                }
            }
        });
        // Populate from FoundItems
        allFound.forEach((item)=>{
            const zone = this.normalizeZone(item.locationFound);
            if (zoneStats[zone]) {
                zoneStats[zone].found++;
            }
        });
        // Compute density / intensity for heatmaps
        const heatmap = Object.values(zoneStats).map((zone)=>{
            const totalActivity = zone.lost + zone.found;
            return {
                name: zone.name,
                x: zone.x,
                y: zone.y,
                value: totalActivity,
                // radius proportional to activity
                radius: Math.max(25, Math.min(60, 20 + totalActivity * 5)),
                lost: zone.lost,
                found: zone.found,
                recovered: zone.recovered
            };
        });
        return {
            stats: {
                activeLost,
                activeFound,
                totalLost,
                totalFound,
                recoveredCount: recoveredLost,
                recoveryRate,
                avgRecoveryHours
            },
            categoryBreakdown,
            heatmap
        };
    }
    normalizeZone(loc) {
        const l = loc.toLowerCase();
        if (l.includes('lib')) return 'Library';
        if (l.includes('cafe') || l.includes('cante') || l.includes('food')) return 'Cafeteria';
        if (l.includes('sport') || l.includes('gym') || l.includes('field') || l.includes('play')) return 'Sports Complex';
        if (l.includes('engin') || l.includes('lab') || l.includes('comp') || l.includes('it ')) return 'Engineering Block';
        if (l.includes('host') || l.includes('dorm') || l.includes('hall')) return 'Hostels';
        if (l.includes('admin') || l.includes('main') || l.includes('offic')) return 'Administration';
        return 'Library'; // Default fallback
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
AnalyticsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AnalyticsService);

//# sourceMappingURL=analytics.service.js.map