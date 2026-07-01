import { MatchingService } from './matching.service';
export declare class MatchingController {
    private readonly matchingService;
    constructor(matchingService: MatchingService);
    findAll(): Promise<({
        lostItem: {
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
        };
        foundItem: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        lostItemId: string;
        foundItemId: string;
        score: number;
    })[]>;
    getUserMatches(userId: string): Promise<({
        claims: {
            id: string;
            createdAt: Date;
            status: string;
            verificationScore: number;
            answers: import("@prisma/client/runtime/client").JsonValue;
            matchId: string;
            claimantId: string;
        }[];
        lostItem: {
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
        };
        foundItem: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        lostItemId: string;
        foundItemId: string;
        score: number;
    })[]>;
}
