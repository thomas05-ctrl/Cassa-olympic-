import React from "react";
import { Match, Team, SportType } from "../types";
import { Trophy, Activity } from "lucide-react";

interface BracketViewProps {
  matches: Match[];
  teams: Team[];
  sport: string;
  theme?: string;
}

export default function BracketView({ matches, teams, sport, theme }: BracketViewProps) {
  const sportMatches = matches.filter((m) => m.sport === sport);

  const getMatchByStage = (stageName: string) => {
    return matches.find(
      (m) => m.sport === sport && m.stage.toLowerCase().includes(stageName.toLowerCase())
    );
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "TBD";
  };

  const getTeamLogoColor = (teamId?: string) => {
    if (!teamId) return "bg-zinc-800 border-zinc-700";
    const team = teams.find((t) => t.id === teamId);
    return team ? team.logoColor : "bg-zinc-800 border-zinc-700";
  };

  // If there are literally no matches in the DB for this sport, display a perfect empty-state bracket card
  if (sportMatches.length === 0) {
    return (
      <div className={`w-full border rounded-2xl p-6 mb-10 text-center shadow ${
        theme === "dark" 
          ? "bg-white/5 border-white/10 text-gray-500" 
          : "bg-white border-slate-205 border-slate-203 border-slate-200 text-slate-400 shadow-md"
      }`}>
        <h4 className={`text-xs font-sans font-black uppercase tracking-widest mb-3.5 flex items-center justify-center gap-1.5 ${
          theme === "dark" ? "text-white" : "text-slate-900"
        }`}>
          <Trophy className="w-4 h-4 text-blue-500 animate-pulse" /> Knockout Standings Bracket Link
        </h4>
        <p className="text-xs leading-relaxed max-w-md mx-auto">
          No matches seeded by the administrator for <span className="font-bold underline uppercase">{sport}</span> yet. Change your role to Admin in the Console to seed the brackets or run a live simulation!
        </p>
      </div>
    );
  }

  // Filter matches matching the sport and stages
  const quarters: Match[] = [
    getMatchByStage("Quarter-final 1") || { id: "q1", sport: sport as SportType, stage: "Quarter-final 1", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "09:30", venue: "Championship Arena" },
    getMatchByStage("Quarter-final 2") || { id: "q2", sport: sport as SportType, stage: "Quarter-final 2", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "11:30", venue: "Championship Arena" },
    getMatchByStage("Quarter-final 3") || { id: "q3", sport: sport as SportType, stage: "Quarter-final 3", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "13:30", venue: "Championship Arena" },
    getMatchByStage("Quarter-final 4") || { id: "q4", sport: sport as SportType, stage: "Quarter-final 4", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "15:30", venue: "Championship Arena" },
  ];

  const semis: Match[] = [
    getMatchByStage("Semi-final 1") || getMatchByStage("Semi-final") || matches.find(m => m.sport === sport && m.stage.toLowerCase().includes("semi-final 1")) || { id: "s1", sport: sport as SportType, stage: "Semi-final 1", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "16:15", venue: "Championship Arena" },
    getMatchByStage("Semi-final 2") || matches.find(m => m.sport === sport && m.stage.toLowerCase().includes("semi-final 2")) || { id: "s2", sport: sport as SportType, stage: "Semi-final 2", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "17:30", venue: "Championship Arena" },
  ];

  const final: Match = getMatchByStage("Final") || getMatchByStage("Finals") || { id: "f1", sport: sport as SportType, stage: "Championship Final", teamAId: undefined, teamBId: undefined, scoreA: undefined, scoreB: undefined, status: "upcoming", date: "Aug 9, 2026", time: "19:00", venue: "Championship Arena" };

  return (
    <div className={`w-full border rounded-2xl p-5 mb-10 shadow-lg overflow-x-auto relative backdrop-blur-md transition-all ${
      theme === "dark" 
        ? "bg-white/5 border-white/10" 
        : "bg-white border-slate-205 border-slate-200 shadow-md text-slate-800 animate-fade-in"
    }`}>
      <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1.5 select-none">
        <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Live Knockout Pipeline
      </div>

      <h4 className={`text-xs font-sans font-black uppercase tracking-widest mb-6 flex items-center gap-1.5 border-b pb-2.5 ${
        theme === "dark" ? "text-white border-white/10" : "text-slate-900 border-slate-100"
      }`}>
        <Trophy className="w-4 h-4 text-blue-500" /> Knockout Bracket Tree
      </h4>

      {sport === "athletics" ? (
        <div className={`p-8 text-center rounded-xl border max-w-lg mx-auto ${
          theme === "dark" ? "bg-black/40 border-white/10 text-gray-400" : "bg-slate-50 border-slate-200 text-slate-600 shadow-inner"
        }`}>
          <p className={`text-xs font-black mb-1.5 uppercase ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>Athletics Heat Racing Stages</p>
          <p className="text-[11px] leading-relaxed">
            Athletics doesn't run dual knockout elimination matches! It uses lane heats, timing qualifiers, and physical ranking rounds. View individual event standings on the leaderboard directly.
          </p>
        </div>
      ) : (
        <div className="min-w-[700px] grid grid-cols-3 gap-6 items-center py-4 relative">
          
          {/* ROUND 1: QUARTER FINALS */}
          <div className="flex flex-col gap-6">
            <span className="text-[9px] font-mono text-gray-400 font-extrabold tracking-widest text-center block mb-1">
              QUARTER-FINALS
            </span>
            <div className="flex flex-col gap-8">
              {quarters.slice(0, 2).map((m: any) => (
                <div key={m.id} className={`rounded-xl border p-2.5 shadow transition-all ${
                  theme === "dark" 
                    ? "bg-black/30 border-white/10 hover:border-blue-500/30" 
                    : "bg-slate-50 border-slate-200 hover:border-slate-350 shadow-sm"
                }`}>
                  <div className={`text-[9px] font-mono mb-2 flex justify-between uppercase ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                    <span>{m.stage}</span>
                    <span className="text-blue-500 font-bold">{m.time}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {/* Team A */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full border border-black/10 ${getTeamLogoColor(m.teamAId)}`} />
                        <span className={`font-semibold truncate max-w-[124px] ${theme === "dark" ? "text-gray-300" : "text-slate-800"}`}>{getTeamName(m.teamAId)}</span>
                      </div>
                      <span className={`font-mono px-1.5 rounded text-[10px] font-bold min-w-[20px] text-center ${
                        theme === "dark" ? "bg-white/5 border border-white/10 text-gray-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                      }`}>
                        {m.scoreA !== undefined ? m.scoreA : "-"}
                      </span>
                    </div>
                    {/* Team B */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full border border-black/10 ${getTeamLogoColor(m.teamBId)}`} />
                        <span className={`font-semibold truncate max-w-[124px] ${theme === "dark" ? "text-gray-300" : "text-slate-800"}`}>{getTeamName(m.teamBId)}</span>
                      </div>
                      <span className={`font-mono px-1.5 rounded text-[10px] font-bold min-w-[20px] text-center ${
                        theme === "dark" ? "bg-white/5 border border-white/10 text-gray-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                      }`}>
                        {m.scoreB !== undefined ? m.scoreB : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROUND 2: SEMI FINALS */}
          <div className="flex flex-col gap-6 relative">
            <span className="text-[9px] font-mono text-gray-400 font-extrabold tracking-widest text-center block mb-1">
              SEMI-FINALS
            </span>
            <div className="flex flex-col gap-24 py-4">
              {semis.map((m: any) => (
                <div key={m.id} className={`rounded-xl border p-3 shadow relative transition-all ${
                  m.status === "live"
                    ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/20"
                    : theme === "dark"
                      ? "bg-black/30 border-white/10"
                      : "bg-slate-50 border-slate-200 shadow-sm"
                }`}>
                  <div className={`text-[9px] font-mono mb-2 flex justify-between uppercase ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                    <span>{m.stage}</span>
                    {m.status === "live" ? (
                      <span className="text-red-500 font-bold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-650 bg-red-600 rounded-full inline-block" />
                        LIVE {m.liveTime || ""}
                      </span>
                    ) : (
                      <span className="text-blue-500 font-bold">{m.time}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full border border-black/10 ${getTeamLogoColor(m.teamAId)}`} />
                        <span className={`font-bold truncate max-w-[124px] ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>{getTeamName(m.teamAId)}</span>
                      </div>
                      <span className={`font-mono px-1.5 rounded text-xs font-bold min-w-[20px] text-center ${
                        theme === "dark" ? "bg-white/5 border border-white/10 text-gray-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                      }`}>
                        {m.scoreA !== undefined ? m.scoreA : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full border border-black/10 ${getTeamLogoColor(m.teamBId)}`} />
                        <span className={`font-bold truncate max-w-[124px] ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>{getTeamName(m.teamBId)}</span>
                      </div>
                      <span className={`font-mono px-1.5 rounded text-xs font-bold min-w-[20px] text-center ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-gray-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"
                      }`}>
                        {m.scoreB !== undefined ? m.scoreB : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROUND 3: GRAND FINAL */}
          <div className="flex flex-col gap-6">
            <span className="text-[9px] font-mono text-yellow-500 font-black tracking-widest text-center block mb-1">
              GOLD MEDAL ACCORD
            </span>
            <div className="flex flex-col items-center">
              <div className={`rounded-2xl border p-4 shadow-xl w-full max-w-[230px] relative overflow-hidden backdrop-blur-md ${
                theme === "dark" 
                  ? "bg-gradient-to-br from-[#0c1424] to-[#1a102a] border-blue-500/40" 
                  : "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200 text-slate-800"
              }`}>
                {/* Visual trophy background outline */}
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/5 rotate-12 flex items-center justify-center pointer-events-none">
                  <Trophy className="w-16 h-16 text-blue-500/10" />
                </div>

                <div className={`text-[10px] font-mono mb-2.5 pb-1.5 flex justify-between uppercase font-bold items-center border-b ${
                  theme === "dark" ? "border-white/10 text-gray-400" : "border-slate-200 text-slate-500"
                }`}>
                  <span className="text-blue-500 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 stroke-[2.5]" /> GOLD FINALS
                  </span>
                  <span>{final.time}</span>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full border border-black/10 ${getTeamLogoColor(final.teamAId)}`} />
                      <span className={`font-black truncate max-w-[114px] ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {getTeamName(final.teamAId)}
                      </span>
                    </div>
                    <span className={`font-mono px-2.5 py-0.5 rounded text-xs font-extrabold min-w-[24px] text-center border ${
                      theme === "dark"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      {final.scoreA !== undefined ? final.scoreA : "TBD"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full border border-black/10 ${getTeamLogoColor(final.teamBId)}`} />
                      <span className={`font-black truncate max-w-[114px] ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {getTeamName(final.teamBId)}
                      </span>
                    </div>
                    <span className={`font-mono px-2.5 py-0.5 rounded text-xs font-extrabold min-w-[24px] text-center border ${
                      theme === "dark"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      {final.scoreB !== undefined ? final.scoreB : "TBD"}
                    </span>
                  </div>
                </div>

                {final.status === "finished" && final.scoreA !== undefined && final.scoreB !== undefined && (
                  <div className="mt-4 pt-2.5 border-t border-white/10 text-center">
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-yellow-500/15 border border-yellow-400/20 text-yellow-500 rounded-full font-bold">
                      🏆 WINNER: {final.scoreA > final.scoreB ? getTeamName(final.teamAId) : getTeamName(final.teamBId)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
