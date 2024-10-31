"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type KeywordTrendTrackerProps = {
  messages: {
    username: string;
    content: string;
    color: string;
    timestamp: number;
  }[];
};

export default function KeywordTrendTracker({
  messages,
}: KeywordTrendTrackerProps) {
  const [cumulativeKeywords, setCumulativeKeywords] = useState<
    { keyword: string; count: number }[]
  >([]);
  const [emoteMap, setEmoteMap] = useState<{ [key: string]: string }>({});

  // Load emoteMap from sessionStorage when the component mounts
  useEffect(() => {
    const storedEmoteMap = sessionStorage.getItem("emoteMap");
    if (storedEmoteMap) {
      setEmoteMap(JSON.parse(storedEmoteMap));
    }
  }, []);

  const updateKeywordCounts = useCallback(() => {
    const keywords: { [key: string]: number } = {};
    messages.forEach((msg) => {
      msg.content
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (!["the", "and", "is", "in", "to"].includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
    });

    const sortedKeywords = Object.entries(keywords)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    setCumulativeKeywords(sortedKeywords);
  }, [messages]);

  useEffect(() => {
    updateKeywordCounts();
  }, [messages, updateKeywordCounts]);

  const parseKeywords = (keyword: string) => {
    return emoteMap && emoteMap[keyword] ? (
      <Image src={emoteMap[keyword]} alt={keyword} width={24} height={24} />
    ) : (
      keyword
    );
  };

  return (
    <div className="p-2 bg-gray-800 rounded-lg shadow-lg text-white space-y-2">
      <h3 className="text-lg font-bold">Trending</h3>
      <ul>
        {cumulativeKeywords.map(({ keyword, count }, index) => (
          <li key={index} className="flex justify-between">
            <span className="capitalize">{parseKeywords(keyword)}</span>
            <span>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
