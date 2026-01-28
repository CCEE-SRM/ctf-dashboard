"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-zinc-900 border-b border-zinc-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/challenges" className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                                CTF
                            </span>
                        </Link>

                        <div className="hidden md:flex gap-4">
                            <Link
                                href="/challenges"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/challenges') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                Challenges
                            </Link>
                            <Link
                                href="/leaderboard"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/leaderboard') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                Leaderboard
                            </Link>
                        </div>
                    </div>

                    <div>
                        <Link
                            href="/profile"
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/profile') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                        >
                            <span>Profile</span>
                            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                <span className="text-xs">👤</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
