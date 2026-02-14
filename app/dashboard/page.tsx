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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">

        <div className="flex justify-between mb-6">
          <h1 className="text-xl font-bold">My Bookmarks</h1>
          <button onClick={logout} className="text-red-500">
            Logout
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            className="border p-2 flex-1"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="border p-2 flex-1"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={addBookmark}
            className="bg-blue-600 text-white px-4"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex justify-between bg-gray-50 p-3 rounded"
            >
              <a href={b.url} target="_blank">
                {b.title}
              </a>
              <button
                onClick={() => deleteBookmark(b.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
