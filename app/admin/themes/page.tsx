"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Theme {
    id: string;
    name: string;
}

export default function AdminThemesPage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [newThemeName, setNewThemeName] = useState("");
    const [loadingData, setLoadingData] = useState(true);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) return;

        const fetchThemes = async () => {
            try {
                const res = await fetch("/api/admin/themes", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setThemes(data);
                }
            } catch (error) {
                console.error("Failed to fetch themes", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchThemes();
    }, [token]);

    const handleCreateTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newThemeName.trim()) return;

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/admin/themes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newThemeName })
            });

            const data = await res.json();

            if (res.ok) {
                setThemes(prev => [...prev, data.theme].sort((a, b) => a.name.localeCompare(b.name)));
                setNewThemeName("");
                setStatus("success");
                setMessage("Theme created successfully!");
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to create theme.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error.");
        }
    };

    if (loading || loadingData) return <div className="p-8 font-mono-retro text-black">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600 font-pixel">Access Denied. Admins only.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-100 text-black p-8 relative font-mono-retro">
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12 flex justify-between items-end border-b-4 border-black pb-6 border-dashed">
                    <div>
                        <h1 className="text-5xl font-pixel mb-2 text-shadow-retro uppercase">Theme Registry</h1>
                        <p className="text-xl font-mono-retro bg-black text-white inline-block px-2">
                            Manage Challenge Categories
                        </p>
                    </div>
                    <Link
                        href="/admin/challenges"
                        className="bg-white text-black font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel text-sm uppercase"
                    >
                        Back to Challenges
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create Theme Form */}
                    <div className="md:col-span-1">
                        <form onSubmit={handleCreateTheme} className="bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                            <h2 className="text-2xl font-pixel uppercase mb-2">Deploy New Theme</h2>
                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Theme Name</label>
                                <input
                                    type="text"
                                    value={newThemeName}
                                    onChange={(e) => setNewThemeName(e.target.value)}
                                    placeholder="e.g. Exploitation"
                                    className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="bg-retro-green text-black font-bold py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-pixel text-lg uppercase"
                            >
                                {status === 'loading' ? 'registering...' : 'register theme'}
                            </button>
                            {message && (
                                <p className={`text-sm font-bold ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Themes Roster */}
                    <div className="md:col-span-2">
                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="p-4 font-pixel text-xl uppercase border-b-2 border-black">Theme Name</th>
                                        <th className="p-4 font-pixel text-xl uppercase border-b-2 border-black">Identifier</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {themes.map(theme => (
                                        <tr key={theme.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                                            <td className="p-4 font-bold text-lg">{theme.name}</td>
                                            <td className="p-4 font-mono-retro text-sm text-zinc-500">{theme.id}</td>
                                        </tr>
                                    ))}
                                    {themes.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="p-12 text-center text-zinc-500 font-pixel text-xl">
                                                NO THEMES ENROLLED.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
