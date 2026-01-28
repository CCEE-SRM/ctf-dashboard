"use client";

import LoginButton from "@/components/LoginButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/challenges");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            CTF Dashboard
          </h1>
          <p className="text-zinc-400 mb-8">
            Sign in to start hacking
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
