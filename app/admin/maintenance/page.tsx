"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminMaintenancePage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();
    const [confirmText, setConfirmText] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        if (confirmText !== "RESET") {
            alert("Verification failed. Please type RESET in all caps.");
            return;
        }

        if (!confirm("FINAL WARNING: This will delete ALL teams, submissions, and non-admin users. This cannot be undone. Proceed?")) {
            return;
        }

        setIsResetting(true);
        setStatus("loading");

        try {
            const res = await fetch("/api/admin/reset", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(data.message);
                setConfirmText("");
            } else {
                throw new Error(data.error || "Reset failed");
            }
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setIsResetting(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-mono-retro">Loading Access...</div>;
    if (!dbUser || dbUser.role !== "ADMIN") {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-8">
                <div className="bg-white border-4 border-red-600 p-8 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] text-center max-w-md">
                    <h1 className="text-4xl font-pixel text-red-600 mb-4">ACCESS DENIED</h1>
                    <p className="font-mono-retro text-zinc-600 mb-6 uppercase">Administrative Clearance Level 4 Required.</p>
                    <Link href="/admin" className="bg-black text-white px-6 py-2 font-pixel hover:bg-zinc-800 transition-colors uppercase">Return to Center</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-8 font-mono-retro selection:bg-red-500 selection:text-white">
            <div className="fixed inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12 border-b-4 border-red-600 pb-6 flex justify-between items-end">
                    <div>
                        <div className="bg-red-600 text-white px-2 py-0.5 text-[10px] uppercase font-pixel inline-block mb-2">
                            Restricted Sector: Maintenance
                        </div>
                        <h1 className="text-5xl md:text-7xl font-pixel text-shadow-retro uppercase tracking-tighter text-red-600">
                            System<br />Purge
                        </h1>
                    </div>
                    <Link href="/admin" className="bg-white text-black p-2 font-pixel text-xs hover:bg-zinc-200 transition-all border-2 border-black mb-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        &lt; BACK_HOME
                    </Link>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    {/* Reset Card */}
                    <div className="bg-zinc-950 border-4 border-zinc-800 p-8 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.3)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rotate-45 translate-x-16 -translate-y-16"></div>

                        <div className="flex items-start gap-6 mb-8">
                            <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-4xl shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                ⚠️
                            </div>
                            <div>
                                <h2 className="text-2xl font-pixel text-red-500 mb-2 uppercase">Core System Wipe</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-xl italic">
                                    Perform a full database reset. This operation will purge all competitive data while maintaining system infrastructure.
                                    Challenges, themes, and staff accounts will be preserved.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-black/50 border-2 border-zinc-800 p-4">
                                <h3 className="text-xs font-bold font-pixel text-zinc-500 mb-4 uppercase tracking-widest">AFFECTED_ENTITIES:</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-zinc-300">
                                    <li className="flex items-center gap-2"><span className="text-red-500 font-pixel">[-]</span> ALL TEAM ROSTERS</li>
                                    <li className="flex items-center gap-2"><span className="text-red-500 font-pixel">[-]</span> ALL CAPTURED FLAGS</li>
                                    <li className="flex items-center gap-2"><span className="text-red-500 font-pixel">[-]</span> ALL HINT PURCHASES</li>
                                    <li className="flex items-center gap-2"><span className="text-red-500 font-pixel">[-]</span> ALL NON-ADMIN ACCOUNTS</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500 font-pixel">[+]</span> CHALLENGES (PRESERVED)</li>
                                    <li className="flex items-center gap-2"><span className="text-green-500 font-pixel">[+]</span> CATEGORIES (PRESERVED)</li>
                                </ul>
                            </div>

                            <div className="bg-red-950/20 border-2 border-red-900/50 p-6 space-y-4">
                                <label className="block text-sm font-bold text-red-400 uppercase tracking-widest text-center">
                                    TYPE "RESET" TO AUTHORIZE COMMAND
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="..."
                                    className="w-full bg-black border-2 border-red-900 p-4 font-pixel text-2xl text-center text-red-500 outline-none focus:border-red-600 transition-all placeholder:text-red-950"
                                />

                                <button
                                    onClick={handleReset}
                                    disabled={isResetting || confirmText !== "RESET"}
                                    className={`w-full py-4 font-pixel text-xl uppercase transition-all border-4 ${confirmText === "RESET"
                                        ? "bg-red-600 border-black text-white hover:bg-red-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                                        : "bg-zinc-800 border-zinc-900 text-zinc-600 cursor-not-allowed"
                                        }`}
                                >
                                    {isResetting ? "EXECUTING PURGE..." : "AUTHORIZE SYSTEM WIPE"}
                                </button>
                            </div>

                            {status !== "idle" && (
                                <div className={`p-4 border-2 font-bold text-sm ${status === "success" ? "bg-green-950/20 border-green-800 text-green-400" : "bg-red-950/20 border-red-800 text-red-400"
                                    }`}>
                                    {status === "loading" ? "> INITIALIZING..." : `> ${message}`}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                        <div className="bg-zinc-900 border-2 border-zinc-800 p-6 opacity-50">
                            <h3 className="font-pixel text-xs text-zinc-500 mb-2 uppercase">Network Status</h3>
                            <div className="font-mono text-sm text-green-500/80">
                                DB_LATENCY: 12ms<br />
                                ACTIVE_THREADS: 4
                            </div>
                        </div>
                        <div className="bg-zinc-900 border-2 border-zinc-800 p-6 flex flex-col justify-between">
                            <h3 className="font-pixel text-xs text-zinc-500 mb-2 uppercase">Help & Documentation</h3>
                            <Link href="/admin/seed" className="text-sm text-blue-400 hover:text-white underline decoration-dashed">
                                Need to batch create users after reset? Use the Seeder Tool.
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .text-shadow-retro {
                    text-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                }
            `}</style>
        </div>
    );
}
