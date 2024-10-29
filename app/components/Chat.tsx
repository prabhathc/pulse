"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import randomColor from "randomcolor";
import anime from "animejs";

type EmotionData = {
  [emotion: string]: number;
};

type Message = {
  username: string;
  content: string;
  color: string;
  timestamp: number;
  emotions?: EmotionData;
};

type ChatProps = {
  user: string;
  setChartData: (data: { category: string; value: number }[]) => void;
  setMessages: (messages: Message[]) => void;
};

export default function Chat({ user, setChartData, setMessages }: ChatProps) {
  const [messages, setLocalMessages] = useState<Message[]>([]);
  const [userMessages, setUserMessages] = useState<{
    [key: string]: Message[];
  }>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const userColorsRef = useRef<{ [key: string]: string }>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Assigns or retrieves a unique color for each user
  const getUserColor = useCallback((username: string) => {
    if (!userColorsRef.current[username]) {
      userColorsRef.current[username] = randomColor({
        seed: username,
        luminosity: "bright",
      });
    }
    return userColorsRef.current[username];
  }, []);

  // Analyzes message emotions via an API call
  const analyzeMessage = async (message: Message) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message.content }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to analyze message:", error);
      return null;
    }
  };

  // Initializes the WebSocket connection
  useEffect(() => {
    if (!user) return;

    const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(`PASS oauth:${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`);
      socket.send(`NICK ${process.env.NEXT_PUBLIC_TWITCH_USER}`);
      socket.send(`JOIN #${user}`);
    };

    // Handles incoming messages from the WebSocket
    socket.onmessage = async (event) => {
      const message = event.data;

      if (message.includes("PRIVMSG")) {
        const username = message.split("!")[0].replace(":", "");
        const content = message.split("PRIVMSG")[1].split(":")[1].trim();

        const newMessage: Message = {
          username,
          content,
          color: getUserColor(username),
          timestamp: Date.now(),
        };

        const analysisResult = await analyzeMessage(newMessage);
        if (analysisResult) {
          newMessage.emotions = analysisResult.sentiment.emotions;
        }

        setLocalMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newMessage].slice(-50); // Keep last 50 messages
          setMessages(updatedMessages); // Update parent component
          updateChartData(updatedMessages);

          // Avoid pushing the same message twice into userMessages
          setUserMessages((prev) => ({
            ...prev,
            [username]: prev[username]?.some(
              (msg) => msg.timestamp === newMessage.timestamp
            )
              ? prev[username]
              : [...(prev[username] || []), newMessage], // Store only new messages
          }));

          return updatedMessages;
        });
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [user, getUserColor]);

  // Updates the chart data based on the last 10 seconds of messages
  const updateChartData = (currentMessages: Message[]) => {
    const now = Date.now();
    const emotionCounts: { [key: string]: number } = {};

    currentMessages.forEach((msg) => {
      if (now - msg.timestamp <= 10000) {
        const msgEmotions = msg.emotions;
        if (msgEmotions) {
          Object.entries(msgEmotions).forEach(([emotion, score]) => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + score;
          });
        }
      }
    });

    setChartData(
      Object.entries(emotionCounts).map(([category, value]) => ({
        category,
        value,
      }))
    );
  };

  // Scroll to the bottom whenever new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle showing the modal for the selected user
  const showUserMessages = (username: string) => {
    setSelectedUser(username);
  };

  // Animate the modal only after it has been rendered
  useEffect(() => {
    if (selectedUser) {
      // Animate the background dimming and blurring
      anime({
        targets: "#userModalBackdrop",
        opacity: [0, 0.9],
        backdropFilter: ["blur(0px)", "blur(10px)"],
        easing: "easeOutExpo",
        duration: 500,
      });

      // Animate the modal floating in
      anime({
        targets: "#userModal",
        opacity: [0, 1],
        translateY: [100, 0],
        easing: "easeOutExpo",
        duration: 500,
      });
    }
  }, [selectedUser]);

  const closeModal = () => {
    // Animate the modal closing and background resetting
    anime({
      targets: "#userModal",
      opacity: [1, 0],
      translateY: [0, 100],
      easing: "easeInQuad",
      duration: 200,
    });

    anime({
      targets: "#userModalBackdrop",
      opacity: [0.9, 0],
      backdropFilter: ["blur(10px)", "blur(0px)"],
      easing: "easeInQuad",
      duration: 200,
      complete: () => setSelectedUser(null), // Only close the modal after the animation completes
    });
  };

  return (
    <div className="relative h-full bg-gray-800 rounded-xl p-4 flex flex-col justify-end overflow-y-auto">
      <ul className="space-y-2" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <li
            key={index}
            className="text-white text-sm p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
            onClick={() => showUserMessages(msg.username)}
          >
            <span className="font-bold" style={{ color: msg.color }}>
              {msg.username}:
            </span>{" "}
            {msg.content}
          </li>
        ))}
      </ul>

      {/* Modal for showing user-specific messages */}
      {selectedUser && (
        <>
          {/* Background dimming and blurring */}
          <div
            id="userModalBackdrop"
            className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-40"
          ></div>

          {/* Modal content */}
          <div
            id="userModal"
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 p-6 rounded-xl w-1/2 h-3/4 overflow-y-auto relative">
              <h2 className="text-white text-xl font-bold mb-4">
                {selectedUser}'s Messages
              </h2>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white bg-red-600 px-4 py-2 rounded-md"
              >
                Close
              </button>
              <ul className="space-y-2">
                {userMessages[selectedUser]?.map((msg, index) => (
                  <li
                    key={index}
                    className="text-white text-sm p-2 rounded-lg bg-gray-700"
                  >
                    <span className="font-bold" style={{ color: msg.color }}>
                      {msg.username}:
                    </span>{" "}
                    {msg.content}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
