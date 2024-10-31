"use client";
import { use, useEffect, useState } from "react";
import Chat from "@/app/components/Chat";
import EmotionAnalysis from "@/app/components/EmotionAnalysis";
import { useRouter } from "next/navigation";
import KeywordTrendTracker from "../components/KeywordTrendTracker";
import TwitchStreamEmbed from "../components/TwitchStreamEmbed"; // Handles video-only Twitch embed
import ChannelInfo from "../components/ChannelInfo"; // Assuming this component displays channel data

export default function UserChat({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const router = useRouter();
  const [chartData, setChartData] = useState<
    { category: string; value: number }[]
  >([]);
  const [messages, setMessages] = useState([]);
  const { user } = use(params);

  // Handle ban modal redirect
  const goHome = () => {
    router.push("/"); // Redirect back to home page to enter a new username
  };

  // Listen for the 'Escape' key press and navigate back home
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        goHome();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Display ban message if user is banned
  if (isBanned) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 h-screen">
        <div className="bg-gray-900 text-white p-8 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4">You Are Banned!</h2>
          <p className="mb-6">You are banned from chatting in this channel.</p>
          <button
            onClick={goHome}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
          >
            Go Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen bg-gray-900 overflow-hidden">
      {/* Left section for Channel Info */}
      <div className="w-1/6 p-4 hidden lg:flex flex-col">
        <div className="bg-gray-800 p-3 rounded-lg overflow-auto">
          <div className="pb-2">
            <ChannelInfo username={user} />
          </div>
          <KeywordTrendTracker messages={messages} />
        </div>
      </div>

      {/* Middle section for Video */}
      <div className="flex-1 flex flex-col items-center pt-4">
        <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg">
          <TwitchStreamEmbed channelName={user} />
        </div>
      </div>

      {/* Right section for Chat */}
      <div className="w-1/6 h-full p-4 hidden lg:flex flex-col">
        <div className="bg-gray-800 rounded-lg shadow-lg h-full overflow-auto">
          <Chat
            user={user}
            setChartData={setChartData}
            setMessages={setMessages}
          />
        </div>
      </div>

      {/* Bottom section for Analytics Components */}
      <div className="w-full lg:w-4/5 p-4 absolute bottom-0 left-1/5 right-1/5 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-1/3 bg-gray-800 p-4 rounded-lg shadow-lg h-32 overflow-auto">
          <EmotionAnalysis chartData={chartData} />
        </div>
      </div>
    </div>
  );
}
