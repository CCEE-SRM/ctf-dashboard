import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "./jwt";
import { AuthenticatedRequest } from "@/types/auth";

type RouteHandler = (req: AuthenticatedRequest, context: any) => Promise<NextResponse>;

export function authenticated(handler: RouteHandler) {
    return async (req: NextRequest, context: any) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = verifyJwt(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
        }

        // Attach user to request (casting needed as NextRequest is read-only for some props, but we extend it)
        (req as AuthenticatedRequest).user = decoded;

        return handler(req as AuthenticatedRequest, context);
    };
}

export function adminOnly(handler: RouteHandler) {
    return async (req: NextRequest, context: any) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = verifyJwt(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
        }

        if (decoded.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        (req as AuthenticatedRequest).user = decoded;

        return handler(req as AuthenticatedRequest, context);
    };
}

export function staffOnly(handler: RouteHandler) {
    return async (req: NextRequest, context: any) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = verifyJwt(token);

        if (!decoded) {
            return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
        }

        if (decoded.role !== "ADMIN" && decoded.role !== "CHALLENGE_CREATOR") {
            return NextResponse.json({ error: "Forbidden: Staff only" }, { status: 403 });
        }

        (req as AuthenticatedRequest).user = decoded;

        return handler(req as AuthenticatedRequest, context);
    };
}
