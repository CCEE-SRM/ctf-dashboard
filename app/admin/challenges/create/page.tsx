"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateChallengePage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        title: "",
        description: "",
        themeId: "",
        link: "",
        thumbnail: "",
        points: 100,
        flag: "",
        hints: [] as { content: string; cost: number }[]
    });

    const [themes, setThemes] = useState<{ id: string; name: string }[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const [loadingThemes, setLoadingThemes] = useState(true);

    useState(() => {
        if (!token) return;
        fetch("/api/admin/themes", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setThemes(data);
                if (data.length > 0) {
                    setForm(prev => ({ ...prev, themeId: data[0].id }));
                }
            })
            .finally(() => setLoadingThemes(false));
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.themeId) {
            alert("Please select a theme.");
            return;
        }
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
                setForm(prev => ({ ...prev, title: "", description: "", flag: "", link: "", thumbnail: "", hints: [] }));
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to create challenge.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error.");
        }
    };

    if (loading) return <div className="p-8 font-mono-retro">Loading...</div>;

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'CHALLENGE_CREATOR')) {
        return <div className="p-8 text-red-600 font-pixel">Access Denied. Staff only.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-100 p-8 font-mono-retro text-black">
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none fixed"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                <header className="mb-8 border-b-4 border-black pb-4">
                    <h1 className="text-4xl font-bold font-pixel mb-2">NEW CHALLENGE // CREATE</h1>
                    <p className="text-zinc-600 font-mono-retro uppercase tracking-widest">Add a new CTF challenge to the platform.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="ENTER CHALLENGE TITLE..."
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Description (Markdown)</label>
                        <textarea
                            name="description"
                            required
                            rows={6}
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            placeholder="## Problem Description..."
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-bold font-pixel uppercase mb-2">Theme</label>
                            <select
                                name="themeId"
                                className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                value={form.themeId}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>SELECT THEME...</option>
                                {themes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <Link href="/admin/themes" className="text-xs text-blue-600 hover:underline mt-1 block font-pixel uppercase">
                                + Add New Theme
                            </Link>
                        </div>

                        <div>
                            <label className="block text-lg font-bold font-pixel uppercase mb-2">Points</label>
                            <input
                                type="number"
                                name="points"
                                required
                                min={0}
                                className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                                value={form.points}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Thumbnail URL (Optional)</label>
                        <input
                            type="text"
                            name="thumbnail"
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            placeholder="https://... (e.g. imgur.com/image.png)"
                            value={form.thumbnail}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Resource Link (Optional)</label>
                        <input
                            type="text"
                            name="link"
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            placeholder="https://..."
                            value={form.link}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2 text-red-600">Flag (SECRET)</label>
                        <input
                            type="text"
                            name="flag"
                            required
                            className="w-full bg-red-50 border-2 border-red-500 p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] transition-shadow"
                            placeholder="Flag{...}"
                            value={form.flag}
                            onChange={handleChange}
                        />
                    </div>

                    {/* HINTS */}
                    <div className="border-t-2 border-black border-dashed pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-lg font-bold font-pixel uppercase">Hints</label>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, hints: [...prev.hints, { content: "", cost: 50 }] }))}
                                className="bg-zinc-200 hover:bg-zinc-300 text-black font-bold py-2 px-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all font-pixel text-sm"
                            >
                                + ADD HINT
                            </button>
                        </div>

                        {form.hints.map((hint, idx) => (
                            <div key={idx} className="flex gap-4 mb-4 items-start bg-zinc-50 p-4 border border-zinc-300">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold font-mono-retro uppercase mb-1">Hint Content</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white border-2 border-zinc-400 p-2 font-mono-retro text-sm focus:border-black focus:outline-none"
                                        value={hint.content}
                                        onChange={(e) => {
                                            const newHints = [...form.hints];
                                            newHints[idx].content = e.target.value;
                                            setForm(prev => ({ ...prev, hints: newHints }));
                                        }}
                                        placeholder="Hint description..."
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-bold font-mono-retro uppercase mb-1">Cost</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        className="w-full bg-white border-2 border-zinc-400 p-2 font-mono-retro text-sm focus:border-black focus:outline-none"
                                        value={hint.cost}
                                        onChange={(e) => {
                                            const newHints = [...form.hints];
                                            newHints[idx].cost = Number(e.target.value);
                                            setForm(prev => ({ ...prev, hints: newHints }));
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, hints: prev.hints.filter((_, i) => i !== idx) }))}
                                    className="mt-6 text-red-500 font-bold hover:text-red-700 font-mono"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        {form.hints.length === 0 && (
                            <div className="text-zinc-400 italic font-mono text-sm text-center py-4 border-2 border-zinc-200 border-dashed">
                                No hints added yet.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t-2 border-black border-dashed mt-6">
                        {message && (
                            <div className={`p-4 border-2 border-black mb-6 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {status === 'success' ? '✅' : '❌'} {message}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 bg-white hover:bg-zinc-100 text-black font-bold py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-pixel text-lg uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 font-pixel text-lg uppercase"
                            >
                                {status === 'loading' ? 'CREATING...' : 'CREATE CHALLENGE'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
