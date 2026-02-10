import { NextRequest } from "next/server";

export interface JwtPayload {
    userId: string;
    email: string;
    role: 'ADMIN' | 'USER';
}

export interface AuthenticatedRequest extends NextRequest {
    user: JwtPayload;
}
