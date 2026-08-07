import React, { useState } from "react";
import { Award as AwardIcon, Trophy, Shield, Users, Medal, Star, CheckCircle2 } from "lucide-react";
import { Match, Team, Player, Award, SportType } from "../types";
import MedalStandingsChart from "./MedalStandingsChart";

interface ParishStandingsProps {
  teams: Team[];
  players: Player[];
  awards: Award[];
  matches: Match[];
  theme: "light" | "dark";
}

export default function ParishStandings({
  teams,
  players,
  awards,
  matches,
  theme
}: ParishStandingsProps) {
  const [selectedParish, setSelectedParish] = useState<string | null>(null);

  // Compute overall gold, silver, bronze count per parish across all matches & sports
  const computedParishTallies = teams.map((team) => {
    // Collect the awards won by this parish
    const parishAwards = awards.filter(
      (a) => a.recipientName?.toLowerCase().includes(team.name.toLowerCase()) || 
             a.teamName?.toLowerCase().includes(team.name.toLowerCase())
    );

    // Sum gold/silver/bronze across sports
    const golds = Number(team.stats?.golds || 0) + parishAwards.filter(a => a.name.toLowerCase().includes("gold") || a.name.toLowerCase().includes("champion")).length;
    const silvers = Number(team.stats?.silvers || 0) + parishAwards.filter(a => a.name.toLowerCase().includes("runner-up") || a.name.toLowerCase().includes("silver")).length;
    const bronzes = Number(team.stats?.bronzes || 0) + parishAwards.filter(a => a.name.toLowerCase().includes("bronze") || a.name.toLowerCase().includes("third")).length;
    
    // Total matches played & points
    const overallPoints = (team.points || 0) + (golds * 5) + (silvers * 3) + (bronzes * 1);

    return {
      ...team,
      golds,
      silvers,
      bronzes,
      overallPoints,
      awardsCount: parishAwards.length
    };
  }).sort((a, b) => b.overallPoints - a.overallPoints || b.golds - a.golds);

  return (
    <div className={`space-y-12 font-sans transition-all duration-200 py-3 ${
      theme === "dark" ? "text-zinc-100" : "text-slate-800"
    }`}>
      
      {/* 1. INTRO DECK / HERO BANNER */}
      <div className="text-left pb-6 border-b border-zinc-800/10 dark:border-zinc-800/40">
        <span className="text-[10px] uppercase tracking-widest font-mono text-amber-500 font-extrabold block mb-1">
          🏅 ARCHDIOCESAN GAMES HONOR ROLL
        </span>
        <h2 className={`text-2xl font-sans font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Parish Standings & Medal Standings Tally
        </h2>
        <p className={`text-xs mt-1.5 leading-relaxed max-w-2xl font-medium ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
          Welcome to the central honor board of the Calabar Archdiocesan Altar Servers Association Nigeria Olympics. Explore real-time medal counts and parish details.
        </p>
      </div>

      {/* D3 MEDAL CHART VISUALIZATION - Content in the margin (no heavy card container) */}
      <div className="space-y-4">
        <div className="text-left border-l-2 border-amber-500 pl-3">
          <h4 className={`text-sm font-sans font-black uppercase tracking-wider flex items-center gap-1.5 ${theme === "dark" ? "text-amber-400" : "text-slate-900"}`}>
            📊 Interactive Medal Standings Analysis (D3.js)
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">Hover over the color-coded segments (Gold, Silver, Bronze) to explore parish outcomes in real-time.</p>
        </div>
        
        <div className="py-2">
          <MedalStandingsChart data={computedParishTallies} theme={theme} />
        </div>
      </div>

      {/* 2. MAIN MEDAL TABLE AND DIRECTORY - Flat style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-l-2 border-amber-500 pl-3">
          <div className="text-left">
            <h4 className={`text-sm font-sans font-black uppercase tracking-wider flex items-center gap-1.5 ${theme === "dark" ? "text-amber-400" : "text-slate-900"}`}>
              <Trophy className="w-4 h-4 text-amber-500" /> Archdiocesan All-Sport Medal Standings
            </h4>
            <p className="text-[11.5px] text-zinc-400 mt-0.5 font-sans">
              Select or click on any parish row to unfold their corresponding registered team competitors and official awards history.
            </p>
          </div>
          <span className={`text-[9px] font-mono border rounded px-2 py-0.5 uppercase font-bold shrink-0 ${
            theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-300 text-amber-900"
          }`}>
            Olympic Table
          </span>
        </div>

        {computedParishTallies.length === 0 ? (
          <div className={`p-10 text-center border border-dashed rounded-xl italic text-xs ${
            theme === "dark" ? "bg-[#0b0c0d] border-zinc-800 text-zinc-500" : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            No competing parishes are registered yet. Set up parishes on the Console to view standings!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="font-mono text-[10px] tracking-wider uppercase border-b border-zinc-800/20 dark:border-zinc-805 text-gray-400">
                  <th className="py-3 px-1 w-16 text-center">RANK</th>
                  <th className="py-3">PARISH ALUMNI GUILD</th>
                  <th className="py-3 text-center w-24">🏆 GOLDS</th>
                  <th className="py-3 text-center w-24">🥈 SILVERS</th>
                  <th className="py-3 text-center w-24">🥉 BRONZES</th>
                  <th className="py-3 text-right w-36 text-amber-500 font-black pr-2">OLYMPIC POINTS</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === "dark" ? "divide-zinc-800/60" : "divide-slate-200/60"}`}>
                {computedParishTallies.map((parish, idx) => {
                  const isGoldLead = idx === 0;
                  const isSelected = selectedParish === parish.id;

                  return (
                    <tr
                      key={parish.id}
                      onClick={() => setSelectedParish(isSelected ? null : parish.id)}
                      className={`transition-all cursor-pointer ${
                        isSelected
                          ? theme === "dark"
                            ? "bg-amber-500/10 text-white"
                            : "bg-amber-50 text-slate-950"
                          : theme === "dark"
                            ? "hover:bg-white/5"
                            : "hover:bg-black/5"
                      }`}
                    >
                      <td className="py-4 px-1 text-center">
                        <span className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center font-mono text-xs font-black border ${
                          isGoldLead
                            ? theme === "dark"
                              ? "bg-amber-500/20 border-amber-500/60 text-amber-450"
                              : "bg-amber-100 border-amber-400 text-amber-950"
                            : theme === "dark"
                              ? "text-zinc-450 border-zinc-800"
                              : "text-slate-605 border-slate-200"
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-sm">
                        <div className="flex items-center gap-3">
                          {parish.logoUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/30 shrink-0 bg-zinc-950 flex items-center justify-center shadow-sm">
                              <img
                                src={parish.logoUrl}
                                alt={parish.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <span className={`w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 ${parish.logoColor || "bg-gray-400"}`} />
                          )}
                          <div className="text-left">
                            <span className="block font-sans whitespace-normal">{parish.name}</span>
                            <span className={`text-[10px] font-medium block font-sans ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                              {parish.played || 0} event matches • {parish.awardsCount} awards conferred
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center font-mono font-extrabold text-sm text-yellow-500">
                        {parish.golds}
                      </td>
                      <td className="py-4 text-center font-mono font-medium text-sm text-gray-400">
                        {parish.silvers}
                      </td>
                      <td className="py-4 text-center font-mono font-medium text-sm text-amber-700">
                        {parish.bronzes}
                      </td>
                      <td className={`py-4 text-right font-mono font-black text-sm pr-2 ${
                        theme === "dark" ? "text-amber-400" : "text-amber-700"
                      }`}>
                        {parish.overallPoints} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. SELECTED PARISH CARD EXPANSION FOR DETAILED ROSTER */}
      {selectedParish && (
        <div className={`p-6 rounded-xl border border-dashed transition-all duration-305 ${
          theme === "dark" ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50/20 border-amber-300"
        }`}>
          {(() => {
            const parish = computedParishTallies.find(p => p.id === selectedParish);
            if (!parish) return null;
            
            const registeredPlayers = players.filter(p => p.teamId === parish.id);
            const parishMedals = awards.filter(
              (a) => a.recipientName?.toLowerCase().includes(parish.name.toLowerCase()) || 
                     a.teamName?.toLowerCase().includes(parish.name.toLowerCase())
            );

            return (
              <div className="text-left space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800/10 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    {parish.logoUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/40 shrink-0 bg-zinc-950 flex items-center justify-center shadow">
                        <img
                          src={parish.logoUrl}
                          alt={parish.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className={`w-5 h-5 rounded-full ${parish.logoColor || "bg-amber-500"}`} />
                    )}
                    <div>
                      <h4 className={`text-lg font-sans font-black uppercase ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {parish.name}
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">Official Parish Competitors & Honor Hub</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedParish(null)}
                    className="text-xs font-mono font-bold text-gray-400 hover:text-red-500 border border-zinc-800/80 hover:border-red-500/30 px-2.5 py-1 rounded transition-colors"
                  >
                    Close Details
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* List of Registered Competitor Athletes */}
                  <div>
                    <h5 className="text-xs font-mono font-black uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-500" /> REGISTERED PARISH ATHLETES ({registeredPlayers.length})
                    </h5>
                    {registeredPlayers.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No registered individual competitors added to this parish yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {registeredPlayers.map(p => (
                          <div key={p.id} className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                            theme === "dark" ? "bg-black/40 border-zinc-900" : "bg-slate-50 border-slate-200"
                          }`}>
                            <div>
                              <p className="font-extrabold leading-none text-zinc-100">{p.name}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">{p.role} • #{p.number}</p>
                            </div>
                            <span className="font-mono text-[10px] text-amber-500 font-black">
                              {p.stats.goals ? `⚽ {p.stats.goals} Goals` : p.stats.bestTimeSeconds ? `🏃 ${p.stats.bestTimeSeconds}s` : "Registered"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Conferred Parish Medallions */}
                  <div>
                    <h5 className="text-xs font-mono font-black uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" /> CONFERRED SILVERWARE & OLYMPIC MEDALS ({parishMedals.length})
                    </h5>
                    {parishMedals.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No official podium finishes conferred by administrators yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {parishMedals.map(a => (
                          <div key={a.id} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs flex gap-3 items-start">
                            <Trophy className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <h6 className="font-black text-white">{a.name}</h6>
                              <p className="text-[10.5px] mt-1 font-medium text-gray-400">{a.recipientName} • {a.details}</p>
                              <span className="text-[9.5px] font-mono text-amber-500 font-bold block mt-1">🏷️ {a.sport.toUpperCase()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. DESIGN ADVICE FOR THE ALTAR SERVERS CHURCH SHOWDOWN - Borderless guide */}
      <div className="pt-6 border-t border-zinc-800/10 dark:border-zinc-850">
        <div className="flex gap-4 items-start text-left">
          <div className={`p-2.5 rounded-xl ${theme === "dark" ? "bg-amber-500/10 text-amber-500" : "bg-amber-100 text-amber-800"}`}>
            <Medal className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className={`text-sm font-sans font-black uppercase tracking-tight ${theme === "dark" ? "text-amber-400" : "text-amber-800"}`}>
              Calabar Altar Servers Nigeria Olympics Planning Guide
            </h4>
            <div className={`text-xs space-y-2 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-slate-600"}`}>
              <p>
                This tracking platform is specifically optimized for administering local parish rivalries. As the main coordinator:
              </p>
              <ul className="list-disc pl-4 space-y-1 mt-1 font-medium">
                <li>Use the <strong>Console</strong> (bottom right button) to create active matches for Football, Volleyball, Table Tennis or Track.</li>
                <li>When a live event begins, click in the console to update goals, athlete sprints, and server tallies in real-time.</li>
                <li>Confer custom awards directly upon parishes when events conclude to automatically update this Olympic points register!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
