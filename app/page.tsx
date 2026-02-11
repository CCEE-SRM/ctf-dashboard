"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, signInWithGoogle, error, setError } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"HOME" | "REGISTER" | "JOIN">("HOME");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  // Current Date/Time for HUD
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    setDateTime(new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }).replace(',', ''));
    const interval = setInterval(() => {
      setDateTime(new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' }).replace(',', ''));
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (!loading && user) {
      router.push("/challenges");
    }
  }, [user, loading, router]);

  const handleRegister = async () => {
    if (!teamName) return;
    await signInWithGoogle({ mode: 'REGISTER', teamName });
  };

  const handleJoin = async () => {
    if (!teamCode || teamCode.length !== 4) return;
    await signInWithGoogle({ mode: 'JOIN', teamCode });
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-pixel text-xl animate-pulse">BOOTING SYSTEM...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-black font-mono-retro overflow-hidden relative selection:bg-retro-green selection:text-black">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10">
        <div className="flex flex-col gap-2">
          <span className="font-pixel text-sm text-zinc-400">{'>'} Greetings</span>
          <span className="font-pixel text-sm text-zinc-400">{'>'} -</span>
          <span className="font-pixel text-sm text-zinc-400 animate-pulse">{'>'} INITIALIZING SEQUENCE...</span>
        </div>

        <div className="text-right hidden md:block">
          <div className="flex justify-end gap-8 font-pixel text-sm text-zinc-500 mb-2">
            <span>+</span>
            <span>+</span>
          </div>
          <div className="font-mono text-zinc-500 text-sm">
            MODE
          </div>
          <div className="font-mono text-xl">
                        // :ACTIVE
          </div>
          <div className="font-mono text-zinc-500 mt-1">
            {dateTime}
          </div>
        </div>
      </div>

      {/* Right Menu */}
      <div className="absolute top-32 right-8 hidden md:block text-right z-10">
        {/* Decorative corners */}
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-zinc-300"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-zinc-300"></div>

        <div className="space-y-1 font-bold text-lg">
          <div className="cursor-pointer hover:bg-black hover:text-white px-2">Rules</div>
          <div className="cursor-pointer hover:bg-black hover:text-white px-2">FAQ</div>
          <div className="cursor-pointer hover:bg-black hover:text-white px-2">Hackceler8</div>
          <div className="cursor-pointer hover:bg-black hover:text-white px-2">BeginnersQuest</div>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center z-20">

        {/* Decorative Elements (Pixel Clusters) */}
        <div className="absolute left-10 top-1/3 opacity-20 md:opacity-100">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-16 h-16 bg-black"></div>
            <div className="w-16 h-16 bg-zinc-300"></div>
            <div className="w-16 h-16 bg-retro-green/50"></div>
            <div className="w-16 h-16 bg-zinc-200"></div>
          </div>
        </div>

        <div className="absolute right-1/4 bottom-10 opacity-20 md:opacity-100">
          <div className="grid grid-cols-3 gap-1">
            <div className="w-8 h-8 bg-zinc-300"></div>
            <div className="w-8 h-8 bg-retro-green/80"></div>
            <div className="w-8 h-8 bg-black"></div>
            <div className="w-8 h-8 bg-black"></div>
            <div className="w-8 h-8 bg-zinc-200"></div>
            <div className="w-8 h-8 bg-zinc-300"></div>
          </div>
        </div>


        {mode === 'HOME' && (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            {/* Logo */}
            <div className="mb-4 inline-block relative">
              <div className="text-6xl mb-2">🚩</div>
            </div>

            <h1 className="text-6xl md:text-8xl font-pixel mb-12 tracking-tighter">
              Capture<br />The Flag
            </h1>

            <div className="flex border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => setMode('REGISTER')}
                className="px-8 py-4 border-r-2 border-black font-mono font-bold hover:bg-zinc-100 hover:text-retro-green transition-colors text-lg"
              >
                Register<br />Team
              </button>
              <button
                onClick={() => setMode('JOIN')}
                className="px-8 py-4 border-r-2 border-black font-mono font-bold hover:bg-zinc-100 hover:text-retro-green transition-colors text-lg"
              >
                Join<br />Team
              </button>
              <button
                onClick={() => signInWithGoogle()} // Regular login if already registered
                className="px-8 py-4 font-mono font-bold hover:bg-zinc-100 hover:text-retro-green transition-colors flex items-center gap-2 text-lg"
              >
                Login
              </button>
            </div>
            {error && (
              <div className="mt-8 p-4 bg-red-100 border-2 border-red-500 text-red-800 font-bold max-w-md mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                ! ERROR: {error}
              </div>
            )}
          </div>
        )}

        {mode === 'REGISTER' && (
          <div className="w-full max-w-md bg-white border-2 border-black p-1 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="border border-zinc-300 p-8 relative">
              {/* Window Controls */}
              <div className="absolute top-0 right-0 p-2 flex border-b border-l border-zinc-300">
                <button onClick={() => { setMode('HOME'); setError(null); }} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 font-bold">✕</button>
              </div>

              <h2 className="text-3xl font-pixel mb-8">Register Team</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold uppercase mb-2 block text-zinc-500">{'>'} ENTER TEAM NAME:</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-zinc-100 border-b-2 border-black p-3 font-mono text-xl focus:outline-none focus:bg-zinc-50"
                    placeholder="Type here..."
                    autoFocus
                  />
                </div>

                <div className="text-xs text-zinc-500 space-y-2">
                  <p>By creating a team you agree to follow the <a href="#" className="underline text-blue-600">rules of the Google CTF</a>.</p>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" className="w-4 h-4 border-2 border-black rounded-none" />
                    <span>I'm over 18 years old.</span>
                  </label>
                </div>

                <div className="text-xs text-zinc-400 italic">
                  Note: You can only create <span className="font-bold text-black border-b border-black">one team</span> per account.
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    onClick={handleRegister}
                    disabled={!teamName}
                    className="bg-white border-2 border-black px-6 py-2 uppercase font-mono text-zinc-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0"
                  >
                    CREATE TEAM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'JOIN' && (
          <div className="w-full max-w-md bg-white border-2 border-black p-1 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="border border-zinc-300 p-8 relative">
              {/* Window Controls */}
              <div className="absolute top-0 right-0 p-2 flex border-b border-l border-zinc-300">
                <button onClick={() => { setMode('HOME'); setError(null); }} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 font-bold">✕</button>
              </div>

              <h2 className="text-3xl font-pixel mb-8">Join Team</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold uppercase mb-2 block text-zinc-500">{'>'} ENTER TEAM ACCESS KEY:</label>
                  <input
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    maxLength={4}
                    className="w-full bg-zinc-100 border-b-2 border-black p-3 font-mono text-xl focus:outline-none focus:bg-zinc-50 tracking-widest text-center"
                    placeholder="____"
                    autoFocus
                  />
                </div>

                <div className="text-xs text-zinc-500">
                  <p>By joining a team you agree to follow the <a href="#" className="underline text-blue-600">rules of the Google CTF</a>.</p>
                </div>

                <div className="pt-8 flex justify-between items-center">
                  <button className="text-xs uppercase text-zinc-400 hover:text-black hover:underline">{'>'} RECOVER KEY</button>

                  <button
                    onClick={handleJoin}
                    disabled={teamCode.length !== 4}
                    className="bg-white border-2 border-black px-6 py-2 uppercase font-mono text-zinc-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-y-0"
                  >
                    JOIN TEAM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
