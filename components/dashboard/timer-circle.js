'use client';

import { useEffect, useState } from 'react';

export function TimerCircle({ frequencyMinutes, lastRun, isActive }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    if (!isActive || !lastRun) {
      setTimeLeft('--:--');
      setProgress(0);
      setIsDue(false);
      return;
    }

    const calculateTime = () => {
      const now = new Date();
      const lastRunDate = new Date(lastRun);
      const totalMs = frequencyMinutes * 60 * 1000;
      const elapsedMs = now.getTime() - lastRunDate.getTime();
      
      const remainingMs = totalMs - elapsedMs;
      
      if (remainingMs <= 0) {
        setTimeLeft('Ready');
        setProgress(100);
        setIsDue(true);
        return;
      }
      
      const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
      const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
      
      if (remainingMinutes > 0) {
        setTimeLeft(`${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`0:${remainingSeconds.toString().padStart(2, '0')}`);
      }
      
      const progressPercent = Math.min((elapsedMs / totalMs) * 100, 100);
      setProgress(progressPercent);
      setIsDue(false);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    
    return () => clearInterval(interval);
  }, [frequencyMinutes, lastRun, isActive]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (!isActive) return '#3f3f46';
    if (isDue) return '#10b981';
    if (progress >= 75) return '#f97316';
    return '#71717a';
  };

  return (
    <div className="relative inline-flex items-center justify-center w-10 h-10">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="#27272a"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={getColor()}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          style={{
            filter: isActive && isDue 
              ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' 
              : isActive && progress >= 75
                ? 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))'
                : 'none'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">
          {isDue ? '✓' : timeLeft}
        </span>
      </div>
    </div>
  );
}