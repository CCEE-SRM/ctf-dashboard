'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: (options?: { mode?: 'REGISTER' | 'JOIN'; teamName?: string; teamCode?: string }) => Promise<void>;
    logout: () => Promise<void>;
    dbUser: any | null; // Placeholder for Prisma User type
    token: string | null;
    error: string | null;
    setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    dbUser: null,
    token: null,
    error: null,
    setError: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sync user with database
    const [syncedUid, setSyncedUid] = useState<string | null>(null);

    // Store registration data temporarily to pass to syncUserToDb
    const registrationDataRef = useRef<{ mode?: 'REGISTER' | 'JOIN'; teamName?: string; teamCode?: string } | null>(null);

    const syncUserToDb = async (firebaseUser: User) => {
        // Prevent re-syncing the same user if we already have data
        if (syncedUid === firebaseUser.uid && dbUser) {
            return;
        }

        try {
            setError(null);
            const idToken = await firebaseUser.getIdToken();

            const body = {
                ...registrationDataRef.current
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                setDbUser(data.user);
                // Optionally store data.token (JWT) here
                setToken(data.token);
                setSyncedUid(firebaseUser.uid);
                // Clear registration data after success
                registrationDataRef.current = null;
            } else {
                console.error("Login API Error:", data.error);
                setError(data.error || "Login failed");

                // If any of these terminal errors occur, we MUST sign out of Firebase
                // to prevent being "Auth Logged In" but "App Logged Out"
                const terminalErrors = ["Server Configuration Error", "Invalid mode", "User not found. Please Register or Join a Team."];

                if (terminalErrors.includes(data.error) || data.requiresRegistration) {
                    await signOut(auth);
                    setDbUser(null);
                    setUser(null);
                    setToken(null);
                    setSyncedUid(null);

                    if (data.error === "Server Configuration Error") {
                        router.push("/");
                    }
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to sync user to DB", error);
            setError("Network error during login");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await syncUserToDb(currentUser);
            } else {
                setDbUser(null);
                setToken(null);
                setSyncedUid(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async (options?: { mode?: 'REGISTER' | 'JOIN'; teamName?: string; teamCode?: string }) => {
        try {
            setError(null);
            if (options) {
                registrationDataRef.current = options;
            }
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                console.warn("Google Sign-In was cancelled by the user.");
            } else {
                console.error("Error signing in with Google", error);
                setError("Failed to sign in with Google");
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, dbUser, token, error, setError }}>
            {children}
        </AuthContext.Provider>
    );
};
