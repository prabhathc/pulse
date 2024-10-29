"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null); // Create a ref for the input element

  // Auto-focus the input element when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() !== "") {
      router.push(`/${username}`); // Redirect to dynamic chat page
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-bold text-white mb-10">
          Enter Twitch Username
        </h1>
        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <input
            type="text"
            placeholder="Type Twitch username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            ref={inputRef} // Attach the ref to the input element
            className="w-full text-center text-white text-2xl py-4 px-6 bg-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          <button
            type="submit"
            className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-2xl rounded-full transition-all duration-200"
          >
            Go to Chat
          </button>
        </form>
      </div>
    </div>
  );
}
