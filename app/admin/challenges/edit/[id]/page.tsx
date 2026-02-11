"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();
    const { id } = use(params);

    const [form, setForm] = useState({
        title: "",
        description: "",
        theme: "Web",
        link: "",
        thumbnail: "",
        points: 100,
        flag: "",
        visible: true,
        hints: [] as { content: string; cost: number }[]
    });

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchChallenge = async () => {
            try {
                const res = await fetch("/api/admin/challenges", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const challenge = data.find((c: any) => c.id === id);
                    if (challenge) {
                        setForm({
                            title: challenge.title,
                            description: challenge.description,
                            theme: challenge.theme,
                            link: challenge.link || "",
                            thumbnail: challenge.thumbnail || "",
                            points: challenge.points,
                            flag: challenge.flag || "",
                            visible: challenge.visible,
                            hints: challenge.hints || []
                        });
                    } else {
                        setMessage("Challenge not found.");
                        setStatus("error");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch challenge", error);
                setMessage("Failed to load challenge data.");
            } finally {
                setLoadingData(false);
            }
        };

        fetchChallenge();
    }, [token, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch(`/api/admin/challenges/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setStatus("success");
                setMessage("Challenge updated successfully!");
                setTimeout(() => router.push("/admin/challenges"), 1500);
            } else {
                const data = await res.json();
                setStatus("error");
                setMessage(data.error || "Failed to update challenge.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error.");
        }
    };

    if (loading || loadingData) return <div className="p-8 font-mono-retro">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600 font-pixel">Access Denied. Admins only.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-100 text-black p-8 font-mono-retro">
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none fixed"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                <header className="mb-8 border-b-4 border-black pb-4">
                    <h1 className="text-4xl font-bold font-pixel mb-2">EDIT CHALLENGE // UPDATE</h1>
                    <p className="text-zinc-600 font-mono-retro uppercase tracking-widest">Update challenge details and visibility.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                    <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-200 border-2 border-black border-dashed">
                        <input
                            type="checkbox"
                            name="visible"
                            id="visible"
                            checked={form.visible}
                            onChange={handleChange as any}
                            className="w-6 h-6 border-2 border-black rounded-none focus:ring-0 text-black cursor-pointer"
                        />
                        <label htmlFor="visible" className="font-bold font-pixel text-xl cursor-pointer select-none uppercase">
                            VISIBLE TO PLAYERS?
                        </label>
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            value={form.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Description (Markdown)</label>
                        <textarea
                            name="description"
                            required
                            rows={6}
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-bold font-pixel uppercase mb-2">Theme</label>
                            <select
                                name="theme"
                                className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
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
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Thumbnail URL</label>
                        <input
                            type="text"
                            name="thumbnail"
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                            value={form.thumbnail}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-bold font-pixel uppercase mb-2">Resource Link</label>
                        <input
                            type="text"
                            name="link"
                            className="w-full bg-zinc-50 border-2 border-black p-3 font-mono-retro focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
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
                                {status === 'loading' ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}
