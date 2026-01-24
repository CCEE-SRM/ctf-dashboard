'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    dbUser: any | null; // Placeholder for Prisma User type
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    dbUser: null,
    token: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync user with database
    const [syncedUid, setSyncedUid] = useState<string | null>(null);

    const syncUserToDb = async (firebaseUser: User) => {
        // Prevent re-syncing the same user if we already have data
        if (syncedUid === firebaseUser.uid && dbUser) {
            return;
        }

        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDbUser(data.user);
                // Optionally store data.token (JWT) here
                console.log("App Token:", data.token);
                setToken(data.token);
                setSyncedUid(firebaseUser.uid);
            }
        } catch (error) {
            console.error("Failed to sync user to DB", error);
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

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google", error);
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
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, dbUser, token }}>
            {children}
        </AuthContext.Provider>
    );
};
