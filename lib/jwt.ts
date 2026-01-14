import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';

interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        return null;
    }
}
