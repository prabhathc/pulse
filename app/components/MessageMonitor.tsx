import { useState, useEffect } from "react";

type MessageMonitorProps = {
  messages: { username: string; content: string }[]; // Message format
  onUpdate: (messageCounts: number[]) => void; // Callback to send message counts per interval
};

const MessageMonitor = ({ messages, onUpdate }: MessageMonitorProps) => {
  const [messageCounts, setMessageCounts] = useState<number[]>([]); // Array to store message counts over time

  useEffect(() => {
    const now = Date.now();

    // Count the number of new messages in this second
    const newMessageCount = messages.length;

    // Append the current message count to the sliding window
    setMessageCounts((prevCounts) => {
      const updatedCounts = [...prevCounts, newMessageCount];

      // Keep the window size to 60 (1 minute if each count represents 1 second)
      if (updatedCounts.length > 60) {
        updatedCounts.shift(); // Remove the oldest count
      }

      // Send the updated counts to the parent component
      onUpdate(updatedCounts);

      return updatedCounts;
    });
  }, [messages, onUpdate]); // Run every time messages are updated

  useEffect(() => {
    // Set an interval to reset message count each second
    const interval = setInterval(() => {
      setMessageCounts((prevCounts) => {
        const updatedCounts = [...prevCounts, 0]; // Add a 0 count if no messages are received

        // Keep the window size to 60 (representing the last 60 seconds)
        if (updatedCounts.length > 60) {
          updatedCounts.shift(); // Remove the oldest count
        }

        onUpdate(updatedCounts);

        return updatedCounts;
      });
    }, 1000); // Update every second

    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, [onUpdate]);

  return null; // No UI, just logic to monitor the message activity
};

export default MessageMonitor;
