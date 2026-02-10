"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface Member {
    name: string | null;
    email: string;
    points: number;
    profileUrl: string | null;
}

interface HistoryPoint {
    time: string;
    score: number;
}

interface Team {
    id: string;
    name: string;
    points: number;
    leader: {
        name: string | null;
        email: string;
        profileUrl: string | null;
    };
    members: Member[];
    history: HistoryPoint[];
    categoryStats?: Record<string, number>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

import RetroLayout from "@/components/RetroLayout";

export default function LeaderboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleTeamIds, setVisibleTeamIds] = useState<string[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/leaderboard");
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data);
                    // Initialize visible teams with Top 5 if not already set or empty
                    if (visibleTeamIds.length === 0 && data.length > 0) {
                        setVisibleTeamIds(data.slice(0, 5).map((t: Team) => t.id));
                    }
                    // Select first team by default if none selected
                    if (!selectedTeamId && data.length > 0) {
                        setSelectedTeamId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []); // Removed deps to avoid reset

    const handleTeamClick = (teamId: string) => {
        setSelectedTeamId(teamId);
        // Add to graph if not visible
        if (!visibleTeamIds.includes(teamId)) {
            setVisibleTeamIds(prev => [...prev, teamId]);
        }
    };

    const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

    // Prepare Category Data for the selected team
    const categoryData = selectedTeam?.categoryStats
        ? Object.entries(selectedTeam.categoryStats).map(([name, count]) => ({ name, count }))
        : [];

    if (loading) {
        return <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-pixel text-xl animate-pulse">LOADING LEADERBOARD...</div>;
    }

    return (
        <RetroLayout title="Scoreboard" activePage="leaderboard">
            <div className="flex-1 h-full overflow-hidden p-4 md:p-8 relative">
                <div className="max-w-7xl mx-auto h-full flex flex-col md:flex-row gap-6">

                    {/* LEFT COLUMN: Leaderboard Table */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-0 border-b-2 border-black bg-zinc-100 font-pixel text-xs md:text-sm sticky top-0 z-10 shrink-0">
                            <div className="col-span-2 p-3 border-r-2 border-black text-center">PLACE</div>
                            <div className="col-span-6 p-3 border-r-2 border-black">NAME</div>
                            <div className="col-span-2 p-3 border-r-2 border-black text-center">FLAGS</div>
                            <div className="col-span-2 p-3 text-right">SCORE</div>
                        </div>

                        {/* Scrollable Table Body */}
                        <div className="overflow-y-auto flex-1 scrollbar-hide">
                            {teams.map((team, index) => {
                                const isSelected = selectedTeamId === team.id;
                                return (
                                    <div
                                        key={team.id}
                                        className="contents" // Use contents to let children sit directly in the grid container
                                    >
                                        <div
                                            onClick={() => handleTeamClick(team.id)}
                                            className={`grid grid-cols-12 gap-0 border-b border-dashed border-zinc-300 cursor-pointer font-mono text-sm group transition-colors col-span-12
                                                ${isSelected ? 'bg-retro-green text-black font-bold' : 'hover:bg-zinc-50'}
                                            `}
                                        >
                                            <div className="col-span-2 p-2 border-r border-zinc-200 flex items-center justify-center">
                                                {index + 1}
                                            </div>
                                            <div className="col-span-6 p-2 border-r border-zinc-200 truncate pl-4">
                                                {team.name}
                                                {isSelected && <span className="block text-[10px] opacity-70">▼ EXPANDED</span>}
                                            </div>
                                            <div className="col-span-2 p-2 border-r border-zinc-200 text-center">
                                                {team.history.length}
                                            </div>
                                            <div className="col-span-2 p-2 text-right pr-4">
                                                {team.points}
                                            </div>
                                        </div>

                                        {/* Expanded Member Details */}
                                        {isSelected && (
                                            <div className="col-span-12 bg-zinc-50 border-b border-black p-3 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                                                <div className="font-pixel text-[10px] text-zinc-400 mb-2">ROSTER_MANIFEST_</div>
                                                <div className="flex flex-col gap-2">
                                                    {team.members.map((member, mIndex) => (
                                                        <div key={mIndex} className="bg-white border border-zinc-200 p-2 flex items-center gap-2 shadow-sm">
                                                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                                                                {member.profileUrl ? (
                                                                    <Image src={member.profileUrl} alt={member.name || 'User'} width={24} height={24} />
                                                                ) : (
                                                                    <span className="text-[10px] font-mono">?</span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-xs truncate">{member.name || member.email.split('@')[0]}</div>
                                                            </div>
                                                            <div className="font-mono text-retro-green font-bold text-xs">
                                                                {member.points}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {team.members.length === 0 && (
                                                        <div className="text-zinc-400 text-xs font-mono italic">No members...</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {teams.length === 0 && (
                                <div className="p-8 text-center text-zinc-400 font-pixel">NO TEAMS</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Graph & Stats */}
                    <div className="flex-1 flex flex-col gap-6 min-h-0">

                        {/* 1. Score Graph */}
                        <div className="bg-white border-2 border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1 min-h-[300px] flex flex-col">
                            <div className="flex justify-between items-center mb-2 px-2 border-b-2 border-dashed border-zinc-300 pb-2 shrink-0">
                                <h2 className="font-pixel text-lg">TOP TEAMS</h2>
                                <span className="font-mono text-xs text-retro-green font-bold px-2 py-1 bg-black/5 rounded">
                                    &gt; {selectedTeam?.name || "SELECT TEAM"}
                                </span>
                            </div>

                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                        <XAxis
                                            dataKey="time"
                                            type="number"
                                            domain={['auto', 'auto']}
                                            tick={false}
                                            axisLine={{ stroke: '#000', strokeWidth: 2 }}
                                        />
                                        <YAxis
                                            orientation="left"
                                            tickLine={false}
                                            axisLine={{ stroke: '#000', strokeWidth: 2 }}
                                            tick={{ fontFamily: 'monospace', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            labelFormatter={(value) => new Date(value).toLocaleString()}
                                            contentStyle={{ backgroundColor: '#fff', border: '2px solid #000', fontFamily: 'monospace' }}
                                        />
                                        {teams
                                            .filter(team => visibleTeamIds.includes(team.id))
                                            .map((team, index) => {
                                                const isSelected = selectedTeamId === team.id;
                                                return (
                                                    <Line
                                                        key={team.id}
                                                        data={team.history.map(h => ({ ...h, time: new Date(h.time).getTime() }))}
                                                        type="stepAfter" // Retro style step chart
                                                        dataKey="score"
                                                        name={team.name}
                                                        stroke={isSelected ? '#8b5cf6' : '#555'}
                                                        strokeWidth={isSelected ? 3 : 1}
                                                        dot={isSelected ? { r: 4, fill: '#8b5cf6', stroke: '#fff' } : false}
                                                        activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                                                        opacity={isSelected ? 1 : 0.3} // Fade stats for non-selected
                                                        animationDuration={500}
                                                    />
                                                );
                                            })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Categories Solved */}
                        <div className="bg-white border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0 h-[200px] overflow-y-auto">
                            <h2 className="font-pixel text-lg mb-4 border-b-2 border-dashed border-zinc-300 pb-2">CATEGORIES_SOLVED</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {categoryData.length > 0 ? categoryData.map((cat) => (
                                    <div key={cat.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-retro-green animate-pulse"></div>
                                        <span className="font-mono text-sm font-bold w-24 text-right">{cat.name}:</span>
                                        <div className="flex-1 h-4 bg-zinc-100 border border-zinc-300 relative">
                                            <div
                                                className="h-full bg-retro-green/50"
                                                style={{ width: `${Math.min((cat.count / 10) * 100, 100)}%` }} // Arbitrary max 10 for bar
                                            ></div>
                                        </div>
                                        <span className="font-mono text-xs">{cat.count}</span>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center text-zinc-400 font-mono text-sm py-4">
                                        NO SOLVES YET
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </RetroLayout>
    );
}
