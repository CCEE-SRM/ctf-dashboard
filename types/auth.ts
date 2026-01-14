import { NextRequest } from "next/server";

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthenticatedRequest extends NextRequest {
    user: JwtPayload;
}
