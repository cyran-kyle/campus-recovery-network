import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<({
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    register(body: any): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    login(body: {
        studentId: string;
        password: any;
    }): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    verifyUser(id: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    deleteUser(id: string): Promise<{
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
    }>;
    getOrCreatePersona(body: {
        studentId: string;
        name: string;
        email: string;
        role?: string;
    }): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    updateTrust(id: string, body: {
        scoreChange: number;
        reason: string;
    }): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
}
