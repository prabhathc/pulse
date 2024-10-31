"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Capture the access token from URL and store it in sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    if (token) {
      sessionStorage.setItem("accessToken", token);
      setIsAuthenticated(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, "/");
    } else {
      const storedToken = sessionStorage.getItem("accessToken");
      if (storedToken) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleSignIn = () => {
    router.push("/api/auth/callback");
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("accessToken");
    setIsAuthenticated(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() !== "") {
      router.push(`/${username}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-bold text-white mb-10">
          {isAuthenticated ? "Enter Twitch Username" : "Login to Continue"}
        </h1>

        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="w-full max-w-lg">
            <input
              type="text"
              placeholder="Type Twitch username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              ref={inputRef}
              className="w-full text-center text-white text-2xl py-4 px-6 bg-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <button
              type="submit"
              className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-2xl rounded-full transition-all duration-200"
            >
              Go to Chat
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xl rounded-full transition-all duration-200"
            >
              Log Out
            </button>
          </form>
        ) : (
          <button
            onClick={handleSignIn}
            className="mt-6 py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white text-2xl rounded-full transition-all duration-200"
          >
            Sign in with Twitch
          </button>
        )}
      </div>
    </div>
  );
}
