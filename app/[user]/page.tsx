"use client";
import { useEffect, useState } from "react";
import Chat from "@/app/components/Chat";
import EmotionAnalysis from "@/app/components/EmotionAnalysis";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function UserChat({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const router = useRouter();
  const [chartData, setChartData] = useState<
    { category: string; value: number }[]
  >([]); // State for chart data
  const [messages, setMessages] = useState([]); // State for messages
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

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []); // Empty dependency array means this effect runs once on mount

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
    <div className="relative flex flex-col h-screen overflow-hidden bg-gray-900 p-8">
      <div className="flex flex-col flex-grow sm:flex-row sm:space-x-4 flex-grow h-full max-w-full">
        {/* Chat Component */}
        <div className="flex flex-col w-full sm:w-1/2 md:w-1/4 h-full">
          <div className="flex-grow overflow-auto">
            <Chat
              user={user}
              setChartData={setChartData}
              setMessages={setMessages}
            />
          </div>
        </div>

        {/* Analytics Component */}
        <div className="hidden sm:flex flex-col w-full sm:w-1/2 md:w-3/4 h-full">
          <div className="flex-grow overflow-auto">
            <EmotionAnalysis data={chartData} />
          </div>
          <div className="flex-grow p-16 bg-black rounded-xl w-full">hi</div>
        </div>
      </div>
    </div>
  );
}
