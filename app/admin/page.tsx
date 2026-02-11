"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LeaderboardTeam {
    id: string;
    points: number;
    name: string;
    leader: {
        name: string | null;
        email: string;
        profileUrl: string | null;
    };
    members: {
        name: string | null;
        email: string;
        profileUrl: string | null;
    }[];
}

interface AppConfig {
    dynamicScoring: boolean;
    eventState: 'START' | 'PAUSE' | 'STOP';
    rateLimit: {
        maxAttempts: number;
        windowSeconds: number;
        cooldownSeconds: number;
    };
}

export default function AdminDashboardPage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();

    // Data State
    const [leaderboard, setLeaderboard] = useState<LeaderboardTeam[]>([]);
    const [config, setConfig] = useState<AppConfig>({
        dynamicScoring: true,
        eventState: 'START',
        rateLimit: { maxAttempts: 3, windowSeconds: 30, cooldownSeconds: 60 }
    });
    const [loadingData, setLoadingData] = useState(true);

    // Fetch Data
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                // Fetch Leaderboard
                const resLeader = await fetch("/api/leaderboard", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resLeader.ok) {
                    const data = await resLeader.json();
                    setLeaderboard(data);
                }

                // Fetch Config
                const resConfig = await fetch("/api/admin/config", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resConfig.ok) {
                    const data = await resConfig.json();
                    setConfig(data);
                }

            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();

        // Polling for live updates on leaderboard? Maybe just fetch once for now.
    }, [token]);

    const handleConfigUpdate = async (update: Partial<AppConfig>) => {
        // Optimistic Update
        const oldConfig = { ...config };
        setConfig({ ...config, ...update });

        try {
            const res = await fetch("/api/admin/config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(update)
            });

            if (!res.ok) {
                setConfig(oldConfig); // Revert
                alert("Failed to update config");
            }
        } catch (error) {
            console.error("Config update error", error);
            setConfig(oldConfig);
        }
    };

    if (loading || loadingData) return <div className="p-8 font-mono-retro text-black">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600 font-pixel">Access Denied. Admins only.</div>;
    }

    const stateColors = {
        START: 'bg-green-500 text-black border-green-700',
        PAUSE: 'bg-yellow-400 text-black border-yellow-600',
        STOP: 'bg-red-500 text-white border-red-700'
    };

    return (
        <div className="min-h-screen bg-zinc-100 text-black p-8 relative selection:bg-purple-500 selection:text-white font-mono-retro">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-12 flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-6 border-dashed gap-4">
                    <div>
                        <h1 className="text-5xl font-pixel mb-2 text-shadow-retro uppercase">Mission Control</h1>
                        <p className="text-xl font-mono-retro bg-black text-white inline-block px-2">
                            Global Operations Center
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/admin/challenges"
                            className="bg-zinc-200 text-black font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel uppercase"
                        >
                            Manage Challenges
                        </Link>
                        <Link
                            href="/admin/announcements"
                            className="bg-zinc-200 text-black font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel uppercase"
                        >
                            Manage Announcements
                        </Link>
                        <Link
                            href="/admin/seed"
                            className="bg-zinc-200 text-black font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel uppercase"
                        >
                            Seed Database
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Controls */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Event State Control */}
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-2xl font-pixel mb-6 border-b-2 border-black pb-2">EVENT STATE</h2>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => handleConfigUpdate({ eventState: 'START' })}
                                    className={`p-4 border-4 font-bold text-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group ${config.eventState === 'START' ? 'bg-green-500 border-black' : 'bg-zinc-100 border-zinc-300 text-zinc-400 hover:border-green-500 hover:text-green-600'}`}
                                >
                                    <span>START</span>
                                    <div className={`w-4 h-4 rounded-full border-2 border-black ${config.eventState === 'START' ? 'bg-black' : 'bg-transparent'}`}></div>
                                </button>

                                <button
                                    onClick={() => handleConfigUpdate({ eventState: 'PAUSE' })}
                                    className={`p-4 border-4 font-bold text-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group ${config.eventState === 'PAUSE' ? 'bg-yellow-400 border-black' : 'bg-zinc-100 border-zinc-300 text-zinc-400 hover:border-yellow-400 hover:text-yellow-600'}`}
                                >
                                    <span>PAUSE</span>
                                    <div className={`w-4 h-4 rounded-full border-2 border-black ${config.eventState === 'PAUSE' ? 'bg-black' : 'bg-transparent'}`}></div>
                                </button>

                                <button
                                    onClick={() => handleConfigUpdate({ eventState: 'STOP' })}
                                    className={`p-4 border-4 font-bold text-xl transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group ${config.eventState === 'STOP' ? 'bg-red-500 text-white border-black' : 'bg-zinc-100 border-zinc-300 text-zinc-400 hover:border-red-500 hover:text-red-600'}`}
                                >
                                    <span>STOP</span>
                                    <div className={`w-4 h-4 rounded-full border-2 border-black ${config.eventState === 'STOP' ? 'bg-black' : 'bg-transparent'}`}></div>
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-zinc-100 border-2 border-black text-sm font-mono-retro">
                                <strong>CURRENT STATUS:</strong><br />
                                {config.eventState === 'START' && <span className="text-green-600">Event is LIVE. Submissions allowed.</span>}
                                {config.eventState === 'PAUSE' && <span className="text-yellow-600">Event PAUSED. Submissions blocked. Challenges visible.</span>}
                                {config.eventState === 'STOP' && <span className="text-red-600">Event STOPPED. Submissions blocked.</span>}
                            </div>
                        </div>

                        {/* Scoring Config */}
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-2xl font-pixel mb-6 border-b-2 border-black pb-2">SCORING LOGIC</h2>
                            <div className="flex items-center justify-between p-4 border-2 border-black bg-zinc-50">
                                <span className="font-bold text-lg">DYNAMIC SCORING</span>
                                <button
                                    onClick={() => handleConfigUpdate({ dynamicScoring: !config.dynamicScoring })}
                                    className={`w-16 h-8 border-2 border-black relative transition-colors ${config.dynamicScoring ? 'bg-purple-600' : 'bg-zinc-300'}`}
                                >
                                    <div className={`absolute top-0 bottom-0 w-8 bg-white border-r-2 border-black transition-transform ${config.dynamicScoring ? 'translate-x-8 border-l-2 border-r-0' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                            <p className="mt-4 text-sm text-zinc-600">
                                {config.dynamicScoring
                                    ? "Start High, Decay Low. Points decrease as more teams solve."
                                    : "Fixed Points. Challenges award static points regardless of solve count."}
                            </p>
                        </div>

                        {/* Rate Limit Config */}
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-2xl font-pixel mb-6 border-b-2 border-black pb-2">RATE LIMITING</h2>
                            <div className="space-y-4 font-mono-retro">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 uppercase">Max Attempts (X)</label>
                                    <input
                                        type="number"
                                        value={config.rateLimit.maxAttempts}
                                        onChange={(e) => handleConfigUpdate({ rateLimit: { ...config.rateLimit, maxAttempts: parseInt(e.target.value) || 0 } })}
                                        className="border-2 border-black p-2 text-lg"
                                    />
                                    <span className="text-xs text-zinc-400">Submissions allowed in window</span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 uppercase">Window Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        value={config.rateLimit.windowSeconds}
                                        onChange={(e) => handleConfigUpdate({ rateLimit: { ...config.rateLimit, windowSeconds: parseInt(e.target.value) || 0 } })}
                                        className="border-2 border-black p-2 text-lg"
                                    />
                                    <span className="text-xs text-zinc-400">Timeframe to check attempts</span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 uppercase">Cooldown Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        value={config.rateLimit.cooldownSeconds}
                                        onChange={(e) => handleConfigUpdate({ rateLimit: { ...config.rateLimit, cooldownSeconds: parseInt(e.target.value) || 0 } })}
                                        className="border-2 border-black p-2 text-lg"
                                    />
                                    <span className="text-xs text-zinc-400">Penalty wait time if limit exceeded</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Leaderboard Widget */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[500px]">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
                                <h2 className="text-2xl font-pixel">LIVE LEADERBOARD</h2>
                                <Link href="/leaderboard" className="text-blue-600 font-bold hover:underline uppercase tracking-wide text-sm font-pixel">[ View Public ]</Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black text-white">
                                        <tr>
                                            <th className="p-3 font-pixel text-lg border-b-2 border-black w-16">#</th>
                                            <th className="p-3 font-pixel text-lg border-b-2 border-black">Team</th>
                                            <th className="p-3 font-pixel text-lg border-b-2 border-black text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((team, index) => (
                                            <tr key={team.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                                                <td className="p-3 font-bold text-xl font-pixel">{index + 1}</td>
                                                <td className="p-3">
                                                    <div className="font-bold text-lg">{team.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono-retro">Leader: {team.leader?.name || 'Unknown'}</div>
                                                </td>
                                                <td className="p-3 text-right font-mono-retro font-bold text-purple-700 text-xl">
                                                    {team.points}
                                                </td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-12 text-center text-zinc-500 font-pixel text-xl">
                                                    NO TEAMS RANKED
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
        </div>
    );
}
