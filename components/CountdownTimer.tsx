"use client";

import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";

interface CountdownTimerProps {
  userTimezone?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ userTimezone = "UTC" }) => {
  const [timeLeft, setTimeLeft] = useState("--:--:--");
  const [nextDrop, setNextDrop] = useState("5:00 AM");

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = DateTime.now().setZone(userTimezone);

        let nextFive = now.set({ hour: 5, minute: 0, second: 0, millisecond: 0 });
        if (now >= nextFive) {
          nextFive = nextFive.plus({ days: 1 });
        }

        setNextDrop(nextFive.toFormat("h:mm a z"));

        const diff = nextFive.diff(now, ["hours", "minutes", "seconds"]).toObject();
        const hours = Math.floor(diff.hours ?? 0).toString().padStart(2, "0");
        const minutes = Math.floor(diff.minutes ?? 0).toString().padStart(2, "0");
        const seconds = Math.floor(diff.seconds ?? 0).toString().padStart(2, "0");

        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      } catch (error) {
        console.error("Error calculating countdown:", error);
        setTimeLeft("--:--:--");
        setNextDrop("5:00 AM");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  return (
    <div className="text-center text-default-600 space-y-1">
      <p className="text-sm">Next drop at {nextDrop}</p>
      <p className="text-lg font-mono font-semibold text-primary-600">{timeLeft}</p>
    </div>
  );
};

export default CountdownTimer;

