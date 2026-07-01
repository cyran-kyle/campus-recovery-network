import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
}
