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

    if (loading) return <div className="p-8 text-center font-mono-retro">Loading...</div>;
    if (!dbUser || dbUser.role !== "ADMIN") return <div className="p-8 text-center text-red-500 font-pixel">Access Denied</div>;

    return (
        <div className="min-h-screen bg-zinc-100 p-8 pb-32 font-mono-retro text-black">
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none fixed"></div>

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                <header className="flex items-center justify-between border-b-4 border-black pb-4">
                    <div>
                        <h1 className="text-4xl font-bold font-pixel tracking-tight text-foreground mb-2">
                            DATABASE_SEEDER // ADMIN
                        </h1>
                        <p className="mt-2 text-zinc-600 font-mono-retro uppercase tracking-widest bg-white inline-block px-2 border-2 border-black">
                            Bulk create teams and users.
                        </p>
                    </div>
                </header>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                    {/* Mode Toggle */}
                    <div className="flex border-2 border-black mb-6">
                        <button
                            onClick={() => setMode("gui")}
                            className={`flex-1 py-3 text-lg font-pixel uppercase transition-all ${mode === "gui" ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-100"}`}
                        >
                            Visual Editor
                        </button>
                        <button
                            onClick={() => setMode("json")}
                            className={`flex-1 py-3 text-lg font-pixel uppercase transition-all border-l-2 border-black ${mode === "json" ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-100"}`}
                        >
                            JSON Input
                        </button>
                    </div>

                    <div className="space-y-6">
                        {mode === "gui" ? (
                            <div className="space-y-8">
                                {guiTeams.map((team, tIndex) => (
                                    <div key={tIndex} className="p-6 bg-zinc-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group">
                                        <button
                                            onClick={() => removeTeam(tIndex)}
                                            className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-bold border-l-2 border-b-2 border-black hover:bg-red-600 z-10"
                                            title="Remove Team"
                                        >
                                            X
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-2">
                                            <div>
                                                <label className="block text-sm font-bold font-pixel uppercase mb-1">Team Name *</label>
                                                <input
                                                    type="text"
                                                    value={team.name}
                                                    onChange={(e) => updateTeam(tIndex, "name", e.target.value)}
                                                    className="w-full bg-white border-2 border-black px-3 py-2 text-sm outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono-retro"
                                                    placeholder="e.g. Hackers United"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold font-pixel uppercase mb-1">Leader Email *</label>
                                                <input
                                                    type="email"
                                                    value={team.leaderEmail}
                                                    onChange={(e) => updateTeam(tIndex, "leaderEmail", e.target.value)}
                                                    className="w-full bg-white border-2 border-black px-3 py-2 text-sm outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono-retro"
                                                    placeholder="leader@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-white border-2 border-black p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold font-pixel uppercase text-zinc-500">Members</span>
                                            </div>
                                            {team.members.map((member, mIndex) => (
                                                <div key={mIndex} className="flex gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) => updateMember(tIndex, mIndex, "name", e.target.value)}
                                                        className="flex-1 bg-zinc-50 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-white transition-all font-mono-retro"
                                                        placeholder="Member Name"
                                                    />
                                                    <input
                                                        type="email"
                                                        value={member.email}
                                                        onChange={(e) => updateMember(tIndex, mIndex, "email", e.target.value)}
                                                        className="flex-1 bg-zinc-50 border-2 border-black px-3 py-2 text-sm outline-none focus:bg-white transition-all font-mono-retro"
                                                        placeholder="member@example.com"
                                                    />
                                                    <button
                                                        onClick={() => removeMember(tIndex, mIndex)}
                                                        className="bg-black text-white w-8 h-8 flex items-center justify-center font-bold hover:bg-zinc-800"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addMember(tIndex)}
                                                className="text-xs bg-blue-100 border-2 border-dashed border-blue-500 text-blue-700 hover:bg-blue-200 font-bold px-3 py-2 w-full mt-2 uppercase font-pixel"
                                            >
                                                + Add Member Slot
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={addTeam}
                                    className="w-full py-4 border-4 border-dashed border-zinc-300 rounded-none text-zinc-400 hover:text-black hover:border-black transition-all font-pixel text-xl uppercase hover:bg-white"
                                >
                                    + Add New Team Block
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    rows={15}
                                    className="w-full bg-black text-green-400 border-4 border-zinc-500 p-4 font-mono text-sm focus:border-green-500 outline-none transition-all resize-y shadow-inner"
                                    placeholder='[{ "name": "Team A", "leaderEmail": "...", "members": [...] }]'
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t-4 border-black border-dashed mt-8">
                            <div className="flex-1">
                                {status === "error" && (
                                    <div className="text-red-800 bg-red-100 border-2 border-red-500 px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        🚨 {message}
                                    </div>
                                )}
                                {status === "success" && (
                                    <div className="text-green-800 bg-green-100 border-2 border-green-500 px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        ✅ {message}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSeed}
                                disabled={status === "loading"}
                                className={`ml-4 px-8 py-4 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel text-lg uppercase border-2 border-black ${status === "loading"
                                    ? "bg-zinc-400 cursor-not-allowed"
                                    : "bg-retro-green text-black hover:bg-green-400"
                                    }`}
                            >
                                {status === "loading" ? "PROCESSING..." : "SEED DATABASE >>"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
