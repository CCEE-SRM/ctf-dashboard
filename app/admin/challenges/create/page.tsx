"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CreateChallengePage() {
    const { token, dbUser, loading } = useAuth();

    const [form, setForm] = useState({
        title: "",
        description: "",
        theme: "Web", // Default theme
        link: "",
        thumbnail: "",
        points: 100,
        flag: ""
    });

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/admin/challenges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage("Challenge created successfully!");
                // Reset form or redirect? 
                // Let's reset for now so they can add more
                setForm(prev => ({ ...prev, title: "", description: "", flag: "", link: "", thumbnail: "" }));
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to create challenge.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error.");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600">Access Denied. Admins only.</div>;
    }

    return (
        <div className="min-h-screen text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold font-serif">Create New Challenge</h1>
                    <p className="text-zinc-500 font-sans">Add a new CTF challenge to the platform.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3"
                            value={form.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description (Markdown Supported)</label>
                        <textarea
                            name="description"
                            required
                            rows={6}
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 font-mono text-sm"
                            placeholder="## Problem Description..."
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme / Category</label>
                            <select
                                name="theme"
                                className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3"
                                value={form.theme}
                                onChange={handleChange}
                            >
                                <option value="Web">Web Exploitation</option>
                                <option value="Crypto">Cryptography</option>
                                <option value="Pwn">Pwn / Binary Exploitation</option>
                                <option value="Reverse">Reverse Engineering</option>
                                <option value="Forensics">Forensics</option>
                                <option value="Misc">Misc</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Points</label>
                            <input
                                type="number"
                                name="points"
                                required
                                min={0}
                                className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3"
                                value={form.points}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Thumbnail Image URL (Optional)</label>
                        <input
                            type="text"
                            name="thumbnail"
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3"
                            placeholder="https://... (e.g. imgur.com/image.png)"
                            value={form.thumbnail}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Resource Link (Optional)</label>
                        <input
                            type="text"
                            name="link"
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg p-3"
                            placeholder="https://..."
                            value={form.link}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-red-600 dark:text-red-400">Flag (SECRET)</label>
                        <input
                            type="text"
                            name="flag"
                            required
                            className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 font-mono"
                            placeholder="Flag{...}"
                            value={form.flag}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-4">
                        {message && (
                            <div className={`p-4 rounded-lg mb-4 ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Creating...' : 'Create Challenge'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
