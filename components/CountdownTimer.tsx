"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  userTimezone?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ userTimezone = 'UTC' }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [nextDrop, setNextDrop] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = new Date();
        const userNow = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).formatToParts(now);

        // Parse the current time in user's timezone
        const year = parseInt(userNow.find(part => part.type === 'year')?.value || '0');
        const month = parseInt(userNow.find(part => part.type === 'month')?.value || '0');
        const day = parseInt(userNow.find(part => part.type === 'day')?.value || '0');
        const hour = parseInt(userNow.find(part => part.type === 'hour')?.value || '0');
        const minute = parseInt(userNow.find(part => part.type === 'minute')?.value || '0');
        const second = parseInt(userNow.find(part => part.type === 'second')?.value || '0');

        // Calculate next 5:00 AM in user's timezone
        let nextFiveAM = new Date();
        nextFiveAM.setFullYear(year, month - 1, day); // month is 0-indexed
        nextFiveAM.setHours(5, 0, 0, 0);

        // If it's already past 5:00 AM today, move to tomorrow
        if (hour >= 5) {
          nextFiveAM.setDate(nextFiveAM.getDate() + 1);
        }

        // Convert to user's timezone for display
        const nextDropTime = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        }).format(nextFiveAM);

        setNextDrop(nextDropTime);

        // Calculate time difference
        const timeDiff = nextFiveAM.getTime() - now.getTime();
        
        if (timeDiff <= 0) {
          setTimeLeft("00:00:00");
          return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } catch (error) {
        console.error('Error calculating countdown:', error);
        setTimeLeft("--:--:--");
        setNextDrop("5:00 AM");
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [userTimezone]);

  return (
    <div className="text-center text-default-600 space-y-1">
      <p className="text-sm">
        Next drop at {nextDrop}
      </p>
      <p className="text-lg font-mono font-semibold text-primary-600">
        {timeLeft}
      </p>
    </div>
  );
};

export default CountdownTimer; 