'use client';

import { useAuth } from '@/context/AuthContext';

export default function LoginButton() {
    const { user, signInWithGoogle, logout } = useAuth();

    if (user) {
        return (
            <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
                Sign Out
            </button>
        );
    }

    return (
        <button
            onClick={signInWithGoogle}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
        >
            <span>Sign in with Google</span>
        </button>
    );
}
