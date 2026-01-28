"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface SeedMember {
    name: string;
    email: string;
    profileUrl?: string;
}

interface SeedTeam {
    name: string;
    leaderEmail: string;
    members: SeedMember[];
}

export default function AdminSeedPage() {
    const { token, dbUser, loading } = useAuth();
    const [mode, setMode] = useState<"json" | "gui">("gui");
    const [jsonInput, setJsonInput] = useState("");
    const [guiTeams, setGuiTeams] = useState<SeedTeam[]>([
        { name: "", leaderEmail: "", members: [{ name: "", email: "" }] }
    ]);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    // GUI Handlers
    const addTeam = () => {
        setGuiTeams([...guiTeams, { name: "", leaderEmail: "", members: [{ name: "", email: "" }] }]);
    };

    const removeTeam = (index: number) => {
        setGuiTeams(guiTeams.filter((_, i) => i !== index));
    };

    const updateTeam = (index: number, field: keyof SeedTeam, value: string) => {
        const newTeams = [...guiTeams];
        newTeams[index] = { ...newTeams[index], [field]: value };
        setGuiTeams(newTeams);
    };

    const addMember = (teamIndex: number) => {
        const newTeams = [...guiTeams];
        newTeams[teamIndex].members.push({ name: "", email: "" });
        setGuiTeams(newTeams);
    };

    const removeMember = (teamIndex: number, memberIndex: number) => {
        const newTeams = [...guiTeams];
        newTeams[teamIndex].members = newTeams[teamIndex].members.filter((_, i) => i !== memberIndex);
        setGuiTeams(newTeams);
    };

    const updateMember = (teamIndex: number, memberIndex: number, field: keyof SeedMember, value: string) => {
        const newTeams = [...guiTeams];
        newTeams[teamIndex].members[memberIndex] = { ...newTeams[teamIndex].members[memberIndex], [field]: value };
        setGuiTeams(newTeams);
    };

    const handleSeed = async () => {
        let payload: any;

        if (mode === "json") {
            if (!jsonInput.trim()) {
                setStatus("error");
                setMessage("Please enter valid JSON data.");
                return;
            }
            try {
                payload = JSON.parse(jsonInput);
                if (!Array.isArray(payload)) throw new Error("Acc must be array");
            } catch {
                setStatus("error");
                setMessage("Invalid JSON format. Must be an array of teams.");
                return;
            }
        } else {
            // Validate GUI Data
            const isValid = guiTeams.every(t => t.name && t.leaderEmail && t.members.every(m => m.email));
            if (!isValid) {
                setStatus("error");
                setMessage("Please fill in all required fields (Team Name, Leader Email, Member Emails).");
                return;
            }
            payload = guiTeams;
        }

        setStatus("loading");
        setMessage("");

        try {
            if (!token) throw new Error("No token");

            const response = await fetch("/api/admin/seed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to seed data.");
            }

            setStatus("success");
            setMessage(`Success! ${data.teamsCreated} teams created/updated.`);
        } catch (error) {
            setStatus("error");
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unexpected error occurred.");
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!dbUser || dbUser.role !== "ADMIN") return <div className="p-8 text-center text-red-500">Access Denied</div>;

    return (
        <div className="min-h-screen text-zinc-900 dark:text-zinc-100 p-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight font-serif text-foreground">
                            Admin Database Seeder
                        </h1>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-400 font-sans">
                            Bulk create teams and users.
                        </p>
                    </div>
                </header>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Mode Toggle */}
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setMode("gui")}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "gui" ? "bg-zinc-50 dark:bg-zinc-800/50 text-blue-600 border-b-2 border-blue-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                        >
                            Visual Editor
                        </button>
                        <button
                            onClick={() => setMode("json")}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "json" ? "bg-zinc-50 dark:bg-zinc-800/50 text-blue-600 border-b-2 border-blue-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                        >
                            JSON Input
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {mode === "gui" ? (
                            <div className="space-y-8">
                                {guiTeams.map((team, tIndex) => (
                                    <div key={tIndex} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 relative group">
                                        <button
                                            onClick={() => removeTeam(tIndex)}
                                            className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                                            title="Remove Team"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Team Name *</label>
                                                <input
                                                    type="text"
                                                    value={team.name}
                                                    onChange={(e) => updateTeam(tIndex, "name", e.target.value)}
                                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g. Hackers United"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Leader Email *</label>
                                                <input
                                                    type="email"
                                                    value={team.leaderEmail}
                                                    onChange={(e) => updateTeam(tIndex, "leaderEmail", e.target.value)}
                                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="leader@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Members</span>
                                            </div>
                                            {team.members.map((member, mIndex) => (
                                                <div key={mIndex} className="flex gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) => updateMember(tIndex, mIndex, "name", e.target.value)}
                                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Member Name"
                                                    />
                                                    <input
                                                        type="email"
                                                        value={member.email}
                                                        onChange={(e) => updateMember(tIndex, mIndex, "email", e.target.value)}
                                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="member@example.com"
                                                    />
                                                    <button
                                                        onClick={() => removeMember(tIndex, mIndex)}
                                                        className="text-zinc-400 hover:text-red-500 p-1"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addMember(tIndex)}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 mt-2"
                                            >
                                                + Add Member
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addTeam}
                                    className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors font-medium"
                                >
                                    + Add Another Team
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    rows={15}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
                                    placeholder='[{ "name": "Team A", "leaderEmail": "...", "members": [...] }]'
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                            <div className="flex-1">
                                {status === "error" && (
                                    <div className="text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm">
                                        🚨 {message}
                                    </div>
                                )}
                                {status === "success" && (
                                    <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg text-sm">
                                        ✅ {message}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSeed}
                                disabled={status === "loading"}
                                className={`ml-4 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${status === "loading"
                                    ? "bg-zinc-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                                    }`}
                            >
                                {status === "loading" ? "Processing..." : "Seed Database"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
