"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ManagedUser {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN' | 'CHALLENGE_CREATOR';
    teamName: string | null;
    profileUrl: string | null;
}

export default function UserManagementPage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminRole, setNewAdminRole] = useState<'ADMIN' | 'CHALLENGE_CREATOR'>("ADMIN");
    const [isAddingAdmin, setIsAddingAdmin] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (error) {
            console.error("Fetch users error", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchUsers();
    }, [token]);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminEmail || !newAdminEmail.includes('@') || isAddingAdmin) return;

        setIsAddingAdmin(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newAdminEmail,
                    role: newAdminRole
                })
            });

            if (res.ok) {
                alert("Admin added/promoted successfully!");
                setNewAdminEmail("");
                fetchUsers(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || "Failed to add admin");
            }
        } catch (error) {
            console.error("Add admin error", error);
            alert("Network error adding admin");
        } finally {
            setIsAddingAdmin(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'USER' | 'ADMIN' | 'CHALLENGE_CREATOR') => {
        if (updating) return;
        if (userId === dbUser?.id) {
            alert("You cannot demote yourself.");
            return;
        }

        const confirmChange = confirm(`Are you sure you want to change this user's role to ${newRole}?`);
        if (!confirmChange) return;

        setUpdating(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update role");
            }
        } catch (error) {
            console.error("Role update error", error);
            alert("Network error updating role");
        } finally {
            setUpdating(null);
        }
    };

    if (loading || (loadingData && users.length === 0)) return <div className="p-8 font-mono-retro">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600 font-pixel">Access Denied.</div>;
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-100 text-black p-8 font-mono-retro selection:bg-purple-500 selection:text-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b-4 border-black pb-6 border-dashed flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-pixel mb-2 uppercase">User Management</h1>
                        <Link href="/admin" className="text-blue-600 hover:underline font-bold uppercase tracking-tight text-sm">[ ← Back to Mission Control ]</Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Add Admin Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-8">
                            <h2 className="text-2xl font-pixel mb-6 border-b-2 border-black pb-2">ADD STAFF ACCOUNT</h2>
                            <form onSubmit={handleAddAdmin} className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 uppercase">Personnel Email</label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        className="border-2 border-black p-3 font-mono text-lg outline-none focus:bg-yellow-50"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 uppercase">Role Assignment</label>
                                    <select
                                        className="border-2 border-black p-3 font-mono text-lg outline-none focus:bg-yellow-50 appearance-none bg-white cursor-pointer"
                                        value={newAdminRole}
                                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                                    >
                                        <option value="ADMIN">ADMINISTRATOR</option>
                                        <option value="CHALLENGE_CREATOR">CHALLENGE CREATOR</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAddingAdmin}
                                    className="w-full bg-black text-white py-3 font-pixel text-lg shadow-[4px_4px_0px_0px_#ccff00] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#ccff00] transition-all disabled:opacity-50"
                                >
                                    {isAddingAdmin ? 'AUTHORIZING...' : 'AUTHORIZE STAFF'}
                                </button>
                                <p className="text-xs text-zinc-500 font-mono italic">
                                    NOTE: If the user does not exist, a placeholder account will be created. They will gain access upon their first login.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: User List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[500px]">
                            <h2 className="text-2xl font-pixel mb-6 border-b-2 border-black pb-2 flex justify-between items-center">
                                <span>PERSONNEL ROSTER</span>
                                <span className="text-xs bg-black text-white px-2 py-1">{filteredUsers.length} UNITS</span>
                            </h2>

                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="SEARCH BY EMAIL OR NAME..."
                                    className="w-full border-2 border-black p-3 font-mono-retro text-sm outline-none focus:border-purple-600"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-zinc-100 text-zinc-600 border-b-2 border-black">
                                        <tr>
                                            <th className="p-3 font-bold text-xs uppercase tracking-widest">User</th>
                                            <th className="p-3 font-bold text-xs uppercase tracking-widest">Email</th>
                                            <th className="p-3 font-bold text-xs uppercase tracking-widest">Role</th>
                                            <th className="p-3 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        {user.profileUrl ? (
                                                            <img src={user.profileUrl} alt="" className="w-6 h-6 rounded border border-black" />
                                                        ) : (
                                                            <div className="w-6 h-6 bg-zinc-200 border border-black flex items-center justify-center text-[8px]">
                                                                N/A
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-sm">{user.name || 'PENDING'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono text-xs text-zinc-600">{user.email}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 text-[8px] font-pixel ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                                                        user.role === 'CHALLENGE_CREATOR' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                                                            'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {user.id !== dbUser.id ? (
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => handleRoleUpdate(user.id, 'USER')}
                                                                disabled={!!updating || user.role === 'USER'}
                                                                className={`text-[8px] font-pixel px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all
                                                                    ${user.role === 'USER' ? 'opacity-30' : 'bg-zinc-200 text-black'}`}
                                                            >
                                                                USER
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleUpdate(user.id, 'CHALLENGE_CREATOR')}
                                                                disabled={!!updating || user.role === 'CHALLENGE_CREATOR'}
                                                                className={`text-[8px] font-pixel px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all
                                                                    ${user.role === 'CHALLENGE_CREATOR' ? 'opacity-30' : 'bg-blue-300 text-blue-900'}`}
                                                            >
                                                                CREATOR
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleUpdate(user.id, 'ADMIN')}
                                                                disabled={!!updating || user.role === 'ADMIN'}
                                                                className={`text-[8px] font-pixel px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all
                                                                    ${user.role === 'ADMIN' ? 'opacity-30' : 'bg-purple-300 text-purple-900'}`}
                                                            >
                                                                ADMIN
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-400 font-pixel text-[10px] italic">[ SELF ]</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-12 text-center text-zinc-400 font-pixel text-lg uppercase italic">No records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
