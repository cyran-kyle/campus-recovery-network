import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
export declare class ItemsService {
    private prisma;
    private matchingService;
    constructor(prisma: PrismaService, matchingService: MatchingService);
    generateFingerprint(data: {
        category: string;
        brand?: string;
        color?: string;
        size?: string;
        uniqueFeatures?: string;
    }): string;
    createLostItem(ownerId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        ownerId: string;
        title: string;
        description: string;
        category: string;
        locationLost: string;
        dateLost: Date;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
    }>;
    createFoundItem(finderId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        category: string;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
        finderId: string;
        locationFound: string;
        dateFound: Date;
        secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findLostItems(): Promise<({
        owner: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        ownerId: string;
        title: string;
        description: string;
        category: string;
        locationLost: string;
        dateLost: Date;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
    })[]>;
    findFoundItems(): Promise<({
        finder: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        category: string;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
        finderId: string;
        locationFound: string;
        dateFound: Date;
        secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
    findOneLost(id: string): Promise<{
        matches: ({
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        })[];
        owner: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        ownerId: string;
        title: string;
        description: string;
        category: string;
        locationLost: string;
        dateLost: Date;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
    }>;
    findOneFound(id: string): Promise<{
        finder: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
        matches: ({
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        category: string;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
        finderId: string;
        locationFound: string;
        dateFound: Date;
        secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    deleteLost(id: string): Promise<{
        id: string;
        createdAt: Date;
        ownerId: string;
        title: string;
        description: string;
        category: string;
        locationLost: string;
        dateLost: Date;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
    }>;
    deleteFound(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        category: string;
        imageUrl: string | null;
        status: string;
        fingerprint: string | null;
        finderId: string;
        locationFound: string;
        dateFound: Date;
        secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
