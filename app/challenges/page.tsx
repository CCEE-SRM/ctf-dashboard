"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";

interface Challenge {
    id: string;
    title: string;
    description: string;
    theme: string;
    link?: string;
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
            setLoading(false); // No token, stop loading but show "Access Denied" or login prompt via logic below
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
                    <h1 className="text-2xl font-bold mb-4">Login Required</h1>
                    <p className="mb-4">Please sign in to view and submit challenges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center border-b border-zinc-200 dark:border-zinc-800 pb-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
                        Knowledge Challenges
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base font-sans">
                        Solve problems to verify your understanding.
                    </p>
                </header>

                <div className="space-y-8">
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className={`group relative p-6 md:p-8 rounded-xl transition-all duration-300 ${challenge.solved
                                ? "bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800"
                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-primary/30"
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-primary font-sans">
                                            {challenge.theme}
                                        </span>
                                        {challenge.solved && (
                                            <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Solved
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                                        {challenge.title}
                                    </h2>
                                </div>
                                <div className="font-mono text-lg font-bold text-zinc-400 dark:text-zinc-600">
                                    {challenge.points}
                                </div>
                            </div>

                            <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 font-sans leading-relaxed mb-8">
                                <ReactMarkdown>{challenge.description}</ReactMarkdown>
                            </div>

                            {challenge.link && (
                                <div className="mb-8">
                                    <a
                                        href={challenge.link}
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

                            {!challenge.solved && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Flag{...}"
                                        className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 font-mono text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        value={inputs[challenge.id] || ""}
                                        onChange={(e) => handleInputChange(challenge.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(challenge.id)}
                                    />
                                    <button
                                        onClick={() => handleSubmit(challenge.id)}
                                        disabled={submitting === challenge.id || !inputs[challenge.id]}
                                        className="bg-primary hover:opacity-90 text-white font-medium px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {submitting === challenge.id ? "..." : "Submit"}
                                    </button>
                                </div>
                            )}

                            {responses[challenge.id] && (
                                <div className={`mt-3 text-sm font-medium ${responses[challenge.id].type === 'success'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-500 dark:text-red-400'
                                    }`}>
                                    {responses[challenge.id].message}
                                </div>
                            )}
                        </div>
                    ))}

                    {challenges.length === 0 && (
                        <div className="text-center py-20 text-zinc-400 italic font-serif">
                            No challenges curated yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
