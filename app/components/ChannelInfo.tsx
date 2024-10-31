"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ChannelInfoProps {
  username: string;
}

export default function ChannelInfo({ username }: ChannelInfoProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [latestFollower, setLatestFollower] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [streamUptime, setStreamUptime] = useState<string | null>(null);
  const [gameCoverUrl, setGameCoverUrl] = useState<string | null>(null);

  const accessToken = sessionStorage.getItem("accessToken");
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

  useEffect(() => {
    if (accessToken && clientId) {
      fetchUserId();
    }
  }, [username]);

  useEffect(() => {
    if (userId) {
      fetchChannelData();
      fetchFollowerData();
      fetchStreamData();
    }
  }, [userId]);

  useEffect(() => {
    if (channelData?.game_name) {
      fetchGameCover(channelData.game_name);
    }
  }, [channelData]);

  const fetchUserId = async () => {
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": clientId!,
        },
      }
    );
    const data = await response.json();
    setUserId(data.data[0]?.id);
  };

  const fetchChannelData = async () => {
    const response = await fetch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": clientId!,
        },
      }
    );
    setChannelData((await response.json()).data[0]);
  };

  const fetchFollowerData = async () => {
    const response = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": clientId!,
        },
      }
    );
    const data = await response.json();
    setFollowerCount(data.total);
    setLatestFollower(data.data[0]?.user_name || "N/A");
  };

  const fetchStreamData = async () => {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": clientId!,
        },
      }
    );
    const stream = (await response.json()).data[0];
    setStreamData(stream);

    if (stream) {
      const startTime = new Date(stream.started_at).getTime();
      const currentTime = new Date().getTime();
      const uptimeInMinutes = Math.floor(
        (currentTime - startTime) / (1000 * 60)
      );
      setStreamUptime(
        `${Math.floor(uptimeInMinutes / 60)}h ${uptimeInMinutes % 60}m`
      );
    }
  };

  const fetchGameCover = async (gameName: string) => {
    const igdbAccessToken = accessToken; // Reuse the Twitch access token
    const igdbClientId = clientId;

    // First, fetch game information to get the cover ID
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": igdbClientId!,
        Authorization: `Bearer ${igdbAccessToken}`,
        "Content-Type": "application/json",
      },
      body: `fields name,cover; where name = "${gameName}";`,
    });

    const data = await response.json();
    const coverId = data[0]?.cover;

    // If cover ID is available, fetch the cover image
    if (coverId) {
      const coverResponse = await fetch("https://api.igdb.com/v4/covers", {
        method: "POST",
        headers: {
          "Client-ID": igdbClientId!,
          Authorization: `Bearer ${igdbAccessToken}`,
          "Content-Type": "application/json",
        },
        body: `fields image_id; where id = ${coverId};`,
      });

      const coverData = await coverResponse.json();
      const imageId = coverData[0]?.image_id;

      if (imageId) {
        setGameCoverUrl(
          `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`
        );
      }
    }
  };

  if (!userId) return <div>Loading user data...</div>;
  if (!channelData || followerCount === null || !streamData)
    return <div>Loading...</div>;

  return (
    <div className="w-full bg-gray-900 rounded-lg p-3 flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        {streamData && (
          <div className="flex items-center space-x-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            <span className="text-green-400 font-medium">LIVE</span>
          </div>
        )}
        <h2 className="text-lg font-semibold text-white">
          {channelData.broadcaster_name}
        </h2>
      </div>
      <div className="flex flex-col">
        {gameCoverUrl && (
          <Image
            src={gameCoverUrl}
            alt="Game Cover"
            width={180}
            height={100}
            className="w-full h-auto object-cover rounded-md"
          />
        )}
        <div className="text-gray-300">
          <p className="flex justify-between">
            <span className="text-white">{channelData.game_name}</span>
          </p>
          <p className="flex justify-between">
            <span>Followers</span>
            <span className="text-white">{followerCount.toLocaleString()}</span>
          </p>
        </div>
      </div>
      {streamData && (
        <div className="text-gray-300">
          <p className="flex justify-between">
            <span>Viewers</span>
            <span className="text-white">{streamData.viewer_count}</span>
          </p>
          <p className="flex justify-between">
            <span>Streaming for</span>
            <span className="text-white">{streamUptime || "N/A"}</span>
          </p>
          <p className="flex justify-between">
            <span>Language</span>
            <span className="text-white">{streamData.language}</span>
          </p>
          <p className="flex justify-between">
            <span>Category</span>
            <span className="text-white">
              {channelData.broadcaster_type || "N/A"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
