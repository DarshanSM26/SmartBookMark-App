"use client";

import { createClient } from "@/lib/supabaseBrowser";
import { useState } from "react";
import toast from "react-hot-toast";
import { Chrome, Moon, Sun } from "lucide-react";

export default function Login() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  const login = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error("Login failed");
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        dark ? "bg-gray-900 text-white" : "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500"
      }`}
    >
      <div className="absolute top-6 right-6">
        <button onClick={() => setDark(!dark)}>
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div
        className={`w-full max-w-md p-10 rounded-2xl shadow-xl transition-all duration-300 ${
          dark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h1 className="text-3xl font-bold text-center mb-4">
          Smart Bookmark
        </h1>

        <p className="text-center text-sm mb-8 opacity-70">
          Save and manage your favorite links securely.
        </p>

        <button
          onClick={login}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          <Chrome size={18} />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
