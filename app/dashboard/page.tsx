"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

export default function Dashboard() {
  const supabase = createClient();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) return;

      setUser(currentUser);

      // Initial fetch
      const { data: initialData } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      setBookmarks(initialData || []);

      // Realtime subscription
      channel = supabase
        .channel("realtime-bookmarks")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${currentUser.id}`,
          },
          async () => {
            const { data: updatedData } = await supabase
              .from("bookmarks")
              .select("*")
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: false });

            setBookmarks(updatedData || []);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const addBookmark = async () => {
    if (!title || !url || !user) return;

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      {/* Welcome Message */}
      <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">Welcome to Smart Bookmark</h1>
      
      {/* Top Center Form */}
      <div className="max-w-md mx-auto bg-white shadow-xl rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">My Bookmarks</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          
          <button
            onClick={addBookmark}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Add Bookmark
          </button>
          
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Bottom Bookmarks Grid */}
      <div className="max-w-7xl mx-auto">
        {bookmarks.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-xl">No bookmarks yet. Add your first bookmark!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition duration-200"
              >
                <h3 className="font-semibold text-lg text-gray-800 mb-2 truncate">{b.title}</h3>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all block mb-3"
                >
                  {b.url}
                </a>
                <button
                  onClick={() => deleteBookmark(b.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded transition duration-200"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
