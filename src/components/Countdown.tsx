import React, { useState, useEffect } from "react";
import { Timer, Calendar, ShieldAlert } from "lucide-react";

export default function Countdown({ theme }: { theme?: string }) {
  const targetDate = new Date("2026-08-09T00:00:00-07:00").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { label: "DAYS", value: timeLeft.days, color: theme === "dark" ? "text-white" : "text-slate-900 font-bold" },
    { label: "HOURS", value: timeLeft.hours, color: "text-amber-500 font-black" },
    { label: "MINUTES", value: timeLeft.minutes, color: theme === "dark" ? "text-white" : "text-slate-900 font-bold" },
    { label: "SECONDS", value: timeLeft.seconds, color: "text-amber-500 font-black" },
  ];

  return (
    <div className={`w-full border rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden backdrop-blur-md transition-all ${
      theme === "dark" 
        ? "bg-[#111111] border-amber-500/20" 
        : "bg-white border-amber-300 text-slate-800 shadow-md"
    }`}>
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 rounded-xl shadow-lg shadow-amber-500/15">
            <Calendar className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className={`text-xs font-mono tracking-wider font-bold ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
              CASSA OLYMPIC BIENNIAL COUNTDOWN
            </div>
            <h3 className={`text-lg font-sans font-black tracking-tight flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              August 9, 2026 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${theme === "dark" ? "bg-zinc-900 border-amber-500/20 text-amber-500 font-bold" : "bg-amber-50 border-amber-200 text-amber-700 font-semibold"}`}>09:00 AM MST</span>
            </h3>
          </div>
        </div>

        {/* Timer Displays */}
        {timeLeft.isOver ? (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-5 py-2.5 rounded-xl text-amber-500 font-bold font-sans">
            <Timer className="w-5 h-5" />
            THE EVENT HAS BEGUN!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full md:w-auto">
            {units.map((unit) => (
              <div 
                key={unit.label} 
                className={`border rounded-xl px-2.5 py-2 flex flex-col items-center justify-center min-w-[70px] ${
                  theme === "dark"
                    ? "bg-[#181818] border-amber-500/20"
                    : "bg-amber-50/50 border-amber-200 shadow-sm"
                }`}
              >
                <span className={`text-xl md:text-2xl font-mono font-black ${unit.color}`}>
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className={`text-[9px] font-sans font-bold tracking-widest mt-1 ${theme === "dark" ? "text-amber-400/80" : "text-amber-800"}`}>
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
