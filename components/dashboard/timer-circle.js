'use client';

import { useEffect, useState } from 'react';

export function TimerCircle({ frequencyMinutes, lastRun, isActive }) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isActive || !lastRun) {
      setProgress(0);
      setTimeLeft('--:--');
      return;
    }

    const calculateProgress = () => {
      const now = new Date();
      const lastRunDate = new Date(lastRun);
      const totalMs = frequencyMinutes * 60 * 1000;
      const elapsedMs = now.getTime() - lastRunDate.getTime();
      const elapsedPercent = Math.min((elapsedMs / totalMs) * 100, 100);
      
      const remainingMs = Math.max(totalMs - elapsedMs, 0);
      const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
      const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
      
      setProgress(elapsedPercent);
      
      if (remainingMinutes > 0) {
        setTimeLeft(`${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`);
      } else if (remainingSeconds > 0) {
        setTimeLeft(`0:${remainingSeconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('Done');
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    
    return () => clearInterval(interval);
  }, [frequencyMinutes, lastRun, isActive]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (!isActive) return '#3f3f46';
    if (progress >= 100) return '#10b981';
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
            filter: isActive && progress >= 100 
              ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' 
              : 'none'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-medium text-white">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}