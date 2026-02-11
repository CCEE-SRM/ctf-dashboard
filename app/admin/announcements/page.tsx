
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        name: string | null;
    };
}

export default function AdminAnnouncementsPage() {
    const { token, dbUser, loading: authLoading } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/announcements");
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;
        setSubmitting(true);

        try {
            const res = await fetch("/api/admin/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

            if (res.ok) {
                setTitle("");
                setContent("");
                fetchAnnouncements();
            } else {
                alert("Failed to create announcement");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const res = await fetch(`/api/admin/announcements?id=${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                fetchAnnouncements();
            } else {
                alert("Failed to delete announcement");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting announcement");
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;
    if (!dbUser || dbUser.role !== 'ADMIN') return <div className="p-8 text-red-600">Access Denied</div>;

    return (
        <div className="min-h-screen bg-zinc-100 font-mono-retro p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-pixel mb-8">Manage Announcements</h1>

                {/* Create Form */}
                <div className="bg-white border-4 border-black p-6 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-pixel mb-6">Create New</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold uppercase mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border-2 border-black p-3 font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold uppercase mb-2">Content (Markdown)</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full border-2 border-black p-3 h-40 font-mono"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-black text-white px-6 py-3 font-bold font-pixel uppercase hover:bg-retro-green hover:text-black transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Posting..." : "Post Announcement"}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-pixel mb-6">History</h2>
                    {announcements.map((ann) => (
                        <div key={ann.id} className="bg-white border-2 border-black p-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold mb-2">{ann.title}</h3>
                                <div className="text-xs text-zinc-500 mb-4">{new Date(ann.createdAt).toLocaleString()} by {ann.author?.name}</div>
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{ann.content}</ReactMarkdown>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(ann.id)}
                                className="text-red-600 font-bold hover:underline ml-4"
                            >
                                DELETE
                            </button>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <div className="text-zinc-500 italic">No announcements yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
