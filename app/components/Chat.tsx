"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
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

export default function Chat({ user, setMessages }: ChatProps) {
  const [hoveredEmote, setHoveredEmote] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [messages, setLocalMessages] = useState<Message[]>([]);
  const [userMessages, setUserMessages] = useState<{
    [key: string]: Message[];
  }>({});
  const [emotes, setEmotes] = useState<{ [emoteCode: string]: string }>({});
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

  // Initializes the WebSocket connection
  useEffect(() => {
    if (!user) return;
    const accessToken = sessionStorage.getItem("accessToken");
    const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(`PASS oauth:${accessToken}`);
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

        setLocalMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newMessage].slice(-100); // Keep last 50 messages
          setMessages(updatedMessages); // Update parent component
          return updatedMessages;
        });

        // Avoid pushing the same message twice into userMessages
        setUserMessages((prev) => ({
          ...prev,
          [username]: prev[username]?.some(
            (msg) => msg.timestamp === newMessage.timestamp
          )
            ? prev[username]
            : [...(prev[username] || []), newMessage], // Store only new messages
        }));
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

  const fetchUserId = async (username) => {
    const accessToken = await sessionStorage.getItem("accessToken");
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
        },
      }
    );
    const data = await response.json();
    return data.data[0]?.id; // This is the user_id
  };

  // Function to fetch Twitch emotes
  const fetchTwitchEmotes = async (userId: string, accessToken: string) => {
    try {
      const globalEmotesResponse = await fetch(
        "https://api.twitch.tv/helix/chat/emotes/global",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-Id": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          },
        }
      );
      const globalEmotesData = await globalEmotesResponse.json();

      const channelEmotesResponse = await fetch(
        `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-Id": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
          },
        }
      );
      const channelEmotesData = await channelEmotesResponse.json();

      const twitchEmoteMap: { [emoteCode: string]: string } = {};

      [...globalEmotesData.data, ...channelEmotesData.data].forEach((emote) => {
        twitchEmoteMap[emote.name] = emote.images.url_1x;
      });

      return twitchEmoteMap;
    } catch (error) {
      console.error("Error fetching Twitch emotes:", error);
      return {};
    }
  };

  // Function to fetch 7TV emotes
  const fetch7TVEmotes = async (userId: string) => {
    try {
      const response = await fetch(
        `https://api.7tv.app/v2/users/${userId}/emotes`
      );
      const emotesData = await response.json();
      const emoteMap: { [key: string]: string } = {};

      emotesData.forEach((emote) => {
        emoteMap[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/1x`;
      });

      return emoteMap;
    } catch (error) {
      console.error("Error fetching 7TV emotes:", error);
      return {};
    }
  };

  // Function to fetch BTTV emotes
  const fetchBTTVEmotes = async (userId: string) => {
    try {
      const channelResponse = await fetch(
        `https://api.betterttv.net/3/cached/users/twitch/${userId}`
      );
      const channelData = await channelResponse.json();

      const bttvEmoteMap: { [emoteCode: string]: string } = {};

      (channelData.channelEmotes as any[])
        .concat(channelData.sharedEmotes as any[])
        .forEach((emote) => {
          bttvEmoteMap[
            emote.code
          ] = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
        });

      return bttvEmoteMap;
    } catch (error) {
      console.error("Error fetching BTTV emotes:", error);
      return {};
    }
  };

  // Main function to fetch all emotes
  const fetchAllEmotes = async (userId: string) => {
    const accessToken = sessionStorage.getItem("accessToken") || "";
    try {
      const [twitchEmotes, bttvEmotes, sevenTVEmotes] = await Promise.all([
        fetchTwitchEmotes(userId, accessToken),
        fetchBTTVEmotes(userId),
        fetch7TVEmotes(userId),
      ]);
      const combinedEmotes = {
        ...twitchEmotes,
        ...bttvEmotes,
        ...sevenTVEmotes,
      };
      setEmotes(combinedEmotes); // Set emotes state
      sessionStorage.setItem("emoteMap", JSON.stringify(combinedEmotes));
      console.log("Emotes loaded: ", combinedEmotes); // Log loaded emotes for debugging
    } catch (error) {
      console.error("Error fetching emotes:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserId(user).then((userId) => {
        if (userId) {
          fetchAllEmotes(userId);
        }
      });
    }
  }, [user]);

  const parseEmotes = (content: string) => {
    return content
      .split(/\s+/) // Split by whitespace to handle punctuation better
      .map((word, index) => {
        const sanitizedWord = word.replace(/[^a-zA-Z0-9]/g, ""); // Remove any punctuation from the word
        if (emotes[sanitizedWord]) {
          return (
            <Image
              key={index}
              src={emotes[sanitizedWord]}
              alt={sanitizedWord}
              width={24}
              height={24}
              className="inline h-6 w-6"
              onMouseEnter={() =>
                setHoveredEmote({
                  src: emotes[sanitizedWord],
                  alt: sanitizedWord,
                })
              }
              onMouseLeave={() => setHoveredEmote(null)}
            />
          );
        } else {
          return <span key={index}>{word} </span>;
        }
      });
  };

  return (
    <div
      className="relative h-full bg-gray-800 rounded-r-lg p-4 flex flex-col justify-end overflow-y-auto"
      ref={chatContainerRef}
    >
      <ul>
        {messages.map((msg, index) => (
          <li
            key={`${msg.username}-${msg.timestamp}`}
            className="text-white text-sm p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
            onClick={() => showUserMessages(msg.username)}
          >
            <span className="font-bold" style={{ color: msg.color }}>
              {msg.username}:
            </span>{" "}
            {parseEmotes(msg.content)}
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
                    key={`${msg.username}-${msg.timestamp}-${index}`}
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

      {hoveredEmote && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 p-2 bg-black bg-opacity-80 rounded-lg shadow-lg">
          <Image
            src={hoveredEmote.src}
            alt={hoveredEmote.alt}
            width={64} // Larger size for the hover effect
            height={64}
            className="h-16 w-16"
          />
        </div>
      )}
    </div>
  );
}
