"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/sys_9e4a/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success - Cookie set by server
        router.push("/sys_9e4a/dashboard");
      } else {
        setError(data.error || "Login Failed");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <>
      <AdminNavbar />
      {/* <div className="min-h-screen flex items-center justify-center bg-[url('/x-max-bg.jpg')] bg-cover bg-center pt-20"> */}
      <div className="min-h-screen flex items-center justify-center bg-[url('/new-year-bg.avif')] bg-cover bg-center pt-20">

        {/* Glassmorphism Card */}
        <div
          className="relative z-10 flex flex-col gap-3 p-8 rounded-2xl w-full max-w-sm bg-white/20 
            border border-white/10 
            shadow-[0_4px_20px_rgba(0,0,0,0.25),_inset_0_1px_2px_rgba(255,255,255,0.3)] overflow-hidden backdrop-blur-sm"
        >
          <span
            className="pointer-events-none absolute inset-0 z-[-5] rounded-2xl"
            style={{
              padding: "1px",
              background:
                "linear-gradient(135deg, #ff8a00, #e52e71, #9d50bb, #00c9ff, #92fe9d)",
              opacity: 0.10, // Reduced opacity for subtle effect behind white/20
            }}
            aria-hidden="true"
          />

          <h2 className="text-2xl font-bold mb-4 text-center text-white drop-shadow-md">Admin Login</h2>

          {error && <div className="bg-red-500/80 text-white p-3 rounded mb-4 text-sm text-center font-medium shadow-sm">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-white mb-1 shadow-black/20 drop-shadow-sm">Username</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-black placeholder-gray-600 transition-all font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-1 shadow-black/20 drop-shadow-sm">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-black placeholder-gray-600 transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-bold shadow-lg 
                         hover:from-red-500 hover:to-pink-500 active:scale-95 transition-all duration-200 mt-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
