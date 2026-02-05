"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Challenge {
    id: string;
    title: string;
    description: string;
    theme: string;
    link?: string;
    thumbnail?: string;
    points: number;
    solved: boolean;
}

export default function ChallengesPage() {
    const { token, loading: authLoading } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [inputs, setInputs] = useState<{ [key: string]: string }>({});
    const [responses, setResponses] = useState<{ [key: string]: { type: "success" | "error"; message: string } }>({});
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch("/api/challenges", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data);
                }
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && token) {
            fetchChallenges();
        } else if (!authLoading && !token) {
            setLoading(false);
        }
    }, [authLoading, token]);

    const handleInputChange = (id: string, value: string) => {
        setInputs((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (id: string) => {
        const flag = inputs[id];
        if (!flag) return;

        setSubmitting(id);

        // Clear previous response
        setResponses(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ challengeId: id, flag }),
            });

            const data = await res.json();

            if (res.ok) {
                setResponses((prev) => ({
                    ...prev,
                    [id]: { type: "success", message: data.message },
                }));
                // Mark as solved locally
                setChallenges(prev => prev.map(c => c.id === id ? { ...c, solved: true } : c));
                // Update selected challenge solved status if open
                if (selectedChallenge?.id === id) {
                    setSelectedChallenge(prev => prev ? { ...prev, solved: true } : null);
                }
            } else {
                setResponses((prev) => ({
                    ...prev,
                    [id]: { type: "error", message: data.error },
                }));
            }
        } catch {
            setResponses((prev) => ({
                ...prev,
                [id]: { type: "error", message: "Network error occurred." },
            }));
        } finally {
            setSubmitting(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="animate-pulse">Loading Challenges...</div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 font-serif">Login Required</h1>
                    <p className="mb-4 font-sans">Please sign in to view and submit challenges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 md:p-12">
                <div className="max-w-4xl mx-auto">

                    <header className="mb-12 text-center border-b border-zinc-200 dark:border-zinc-800 pb-8">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
                            Knowledge Challenges
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base font-sans">
                            Solve problems to verify your understanding.
                        </p>
                    </header>

                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {challenges.map((challenge) => (
                            <button
                                key={challenge.id}
                                onClick={() => setSelectedChallenge(challenge)}
                                className={`group relative flex flex-col items-start text-left bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-300 overflow-hidden h-full hover:shadow-xl hover:-translate-y-1 ${challenge.solved
                                    ? "border-green-200 dark:border-green-900/30 opacity-75"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-primary/50"
                                    }`}
                            >
                                {/* Thumbnail or Placeholder */}
                                <div className="w-full aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {challenge.thumbnail ? (
                                        <img src={challenge.thumbnail} alt={challenge.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="text-4xl font-serif text-zinc-300 dark:text-zinc-700 select-none">
                                            {challenge.title[0]}
                                        </div>
                                    )}
                                    {challenge.solved && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                            SOLVED
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 w-full flex-1 flex flex-col">
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-sans bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                            {challenge.theme}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-primary">
                                            {challenge.points} pts
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                        {challenge.title}
                                    </h3>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400 font-sans line-clamp-2 mb-4 prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 prose-headings:text-base prose-headings:my-0">
                                        <ReactMarkdown>{challenge.description}</ReactMarkdown>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {challenges.length === 0 && (
                        <div className="text-center py-20 text-zinc-400 italic font-serif">
                            No challenges curated yet.
                        </div>
                    )}
                </div>

                {/* Modal */}
                {selectedChallenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary font-sans">
                                                {selectedChallenge.theme}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-zinc-400">
                                                {selectedChallenge.points} pts
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-serif font-bold text-foreground">
                                            {selectedChallenge.title}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedChallenge(null)}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {selectedChallenge.thumbnail && (
                                    <img
                                        src={selectedChallenge.thumbnail}
                                        alt={selectedChallenge.title}
                                        className="w-full h-64 object-cover rounded-xl mb-8 border border-zinc-100 dark:border-zinc-800"
                                    />
                                )}

                                <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed mb-8">
                                    <ReactMarkdown>{selectedChallenge.description}</ReactMarkdown>
                                </div>

                                {selectedChallenge.link && (
                                    <div className="mb-8">
                                        <a
                                            href={selectedChallenge.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Related Resources
                                        </a>
                                    </div>
                                )}

                                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                                    {selectedChallenge.solved ? (
                                        <div className="flex items-center justify-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold border border-green-200 dark:border-green-800/50">
                                            ✅ Challenge Solved
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Flag{...}"
                                                    className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 font-mono text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                                    value={inputs[selectedChallenge.id] || ""}
                                                    onChange={(e) => handleInputChange(selectedChallenge.id, e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(selectedChallenge.id)}
                                                />
                                                <button
                                                    onClick={() => handleSubmit(selectedChallenge.id)}
                                                    disabled={submitting === selectedChallenge.id || !inputs[selectedChallenge.id]}
                                                    className="bg-primary hover:opacity-90 text-white font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {submitting === selectedChallenge.id ? "..." : "Submit"}
                                                </button>
                                            </div>
                                            {responses[selectedChallenge.id] && (
                                                <div className={`mt-2 text-sm font-medium ${responses[selectedChallenge.id].type === 'success'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-500 dark:text-red-400'
                                                    }`}>
                                                    {responses[selectedChallenge.id].message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}
