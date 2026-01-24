"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AdminSeedPage() {
    const { token, dbUser, loading } = useAuth();
    const [jsonInput, setJsonInput] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSeed = async () => {
        if (!jsonInput.trim()) {
            setStatus("error");
            setMessage("Please enter valid JSON data.");
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(jsonInput);
        } catch {
            setStatus("error");
            setMessage("Invalid JSON format.");
            return;
        }

        if (!Array.isArray(parsedData)) {
            setStatus("error");
            setMessage("Data must be an array of teams.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            if (!token) {
                throw new Error("No authentication token found.");
            }

            const response = await fetch("/api/admin/seed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(parsedData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to seed data.");
            }

            setStatus("success");
            setMessage(`Success! ${data.teamsCreated} teams created.`);
        } catch (error) {
            setStatus("error");
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unexpected error occurred.");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!dbUser || dbUser.role !== "ADMIN") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        Admin Database Seeder
                    </h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                        Bulk create teams and users by pasting a JSON array below.
                    </p>
                </header>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-6 space-y-4">
                        <label htmlFor="json-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            JSON Payload (Array of Teams)
                        </label>
                        <div className="relative">
                            <textarea
                                id="json-input"
                                rows={15}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
                                placeholder='[
  {
    "name": "Team Alpha",
    "points": 100,
    "leaderEmail": "leader@example.com",
    "members": [
      { "email": "member1@example.com", "name": "Member One" }
    ]
  }
]'
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex-1">
                                {status === "error" && (
                                    <div className="text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
                                        🚨 {message}
                                    </div>
                                )}
                                {status === "success" && (
                                    <div className="text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg text-sm border border-green-200 dark:border-green-800/50">
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
                                {status === "loading" ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    "Seed Database"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800/50">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Instructions</h3>
                    <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                        <li>Ensure the JSON is a valid array of team objects.</li>
                        <li>Members will be created or updated based on email.</li>
                        <li>The leader does not strictly need to be in the members list, but it is recommended.</li>
                        <li><b>Warning:</b> Large payloads may take time to process.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
