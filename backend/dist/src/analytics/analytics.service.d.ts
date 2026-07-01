import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        stats: {
            activeLost: number;
            activeFound: number;
            totalLost: number;
            totalFound: number;
            recoveredCount: number;
            recoveryRate: number;
            avgRecoveryHours: number;
        };
        categoryBreakdown: {
            name: string;
            lost: number;
            recovered: number;
        }[];
        heatmap: {
            name: string;
            x: number;
            y: number;
            value: number;
            radius: number;
            lost: number;
            found: number;
            recovered: number;
        }[];
    }>;
    private normalizeZone;
}
