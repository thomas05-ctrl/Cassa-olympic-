import React, { useState } from "react";
import { SportType, Team, Player, Match, Award, MediaPost } from "../types";
import { Trophy, HelpCircle, Calendar, Award as AwardIcon, Flame, ArrowUpRight, Play, Heart, Lock, CheckCircle2, Share2 } from "lucide-react";

interface SportDashboardProps {
  sport: SportType;
  teams: Team[];
  players: Player[];
  matches: Match[];
  awards: Award[];
  theme?: string;
  onSelectVenue?: (venueId: string) => void;
  onSetNavTab?: (tab: string) => void;
  currentUser?: { username: string; nickname: string } | null;
  mediaPosts?: MediaPost[];
  onLikePost?: (postId: string) => void;
  onReactPost?: (postId: string, emoji: string) => void;
  anonUserId?: string;
}

function TeamLogo({ team, theme }: { team?: Team; theme?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!team) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold leading-none select-none bg-zinc-800/60 text-amber-500">
        ⛪
      </div>
    );
  }

  return (
    <div className={`relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${
      theme === "dark" ? "border-amber-500/20 bg-zinc-950" : "border-slate-205 bg-white shadow-sm"
    }`}>
      {team.logoUrl && !imgError ? (
        <img
          src={team.logoUrl}
          alt={team.name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`w-full h-full flex items-center justify-center text-xs font-black text-white ${team.logoColor || "bg-amber-500"}`}>
          ⛪
        </span>
      )}
    </div>
  );
}

export default function SportDashboard({
  sport,
  teams,
  players,
  matches,
  awards,
  theme,
  onSelectVenue,
  onSetNavTab,
  currentUser,
  mediaPosts = [],
  onLikePost,
  onReactPost,
  anonUserId
}: SportDashboardProps) {
  const [mediaFilter, setMediaFilter] = useState<"all" | "live" | "recent" | "upcoming">("all");
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [awardSport, setAwardSport] = useState<string>(sport);

  const handleShareMatch = async (match: Match) => {
    const teamA = getTeamName(match.teamAId);
    const teamB = getTeamName(match.teamBId);
    const scoreStr = match.sport === "athletics" 
      ? "" 
      : (match.scoreA !== undefined && match.scoreB !== undefined) 
        ? ` (${match.scoreA} : ${match.scoreB})` 
        : " (Upcoming)";
    
    const sportLabel = match.sport.charAt(0).toUpperCase() + match.sport.slice(1);
    
    let text = "";
    if (match.sport === "athletics") {
      const topRunners = match.runners && match.runners.length > 0 
        ? match.runners.slice(0, 3).map(r => `🏅 ${r.rank}. ${r.playerName} (${r.timeSeconds}s)`).join("\n")
        : "Standings pending";
      text = `⭐ Calabar Archdiocesan Olympics 2026 - Athletics: ${match.stage} at ${match.venue}\nResults:\n${topRunners}`;
    } else {
      text = `⭐ Calabar Archdiocesan Olympics 2026 - ${sportLabel} Match: ${teamA} vs ${teamB}${scoreStr}\nStage: ${match.stage}\nVenue: ${match.venue}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Calabar Archdiocesan Olympics: ${sportLabel}`,
          text: text,
          url: window.location.href
        });
        setCopiedMessage("Shared successfully!");
        setTimeout(() => setCopiedMessage(null), 3000);
      } catch (err) {
        try {
          await navigator.clipboard.writeText(`${text}\nLink: ${window.location.href}`);
          setCopiedMessage("Score summary copied to clipboard!");
          setTimeout(() => setCopiedMessage(null), 3000);
        } catch (clipErr) {
          console.error("Clipboard copy failed", clipErr);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\nLink: ${window.location.href}`);
        setCopiedMessage("Score summary copied to clipboard!");
        setTimeout(() => setCopiedMessage(null), 3000);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    }
  };

  React.useEffect(() => {
    setAwardSport(sport);
  }, [sport]);

  // Filter teams, players, matches, awards
  const filteredTeams = teams
    .filter((t) => t.sport === "all" || t.sport === sport || !t.sport)
    .sort((a, b) => b.points - a.points || (Number(b.stats.gd || 0) - Number(a.stats.gd || 0)));

  const filteredPlayers = players
    .filter((p) => p.sport === sport)
    .sort((a, b) => {
      if (sport === "football") {
        return (b.stats.goals || 0) - (a.stats.goals || 0);
      } else if (sport === "athletics") {
        return (a.stats.bestTimeSeconds || 99) - (b.stats.bestTimeSeconds || 99);
      } else if (sport === "volleyball") {
        return (b.stats.blocks || 0) - (a.stats.blocks || 0);
      } else {
        return (b.stats.setsWon || 0) - (a.stats.setsWon || 0);
      }
    });

  const filteredMatches = matches
    .filter((m) => m.sport === sport)
    .sort((a, b) => {
      const statusWeight = { live: 0, upcoming: 1, finished: 2 };
      return (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0);
    });

  const filteredAwards = awards.filter((a) => a.sport === sport);

  const SPORT_AWARDS_CATALOG: Record<string, { key: string; name: string; searchKeyword: string[] }[]> = {
    football: [
      { key: "highest_goal_scorer", name: "⚽ Highest Goal Scorer", searchKeyword: ["goal", "scorer", "golden boot", "highest goal", "top scorer"] },
      { key: "best_goalkeeper", name: "🧤 Best Goalkeeper (Golden Glove)", searchKeyword: ["goalkeeper", "golden glove", "keeper"] },
      { key: "mvp", name: "⭐ Tournament Most Valuable Player (MVP)", searchKeyword: ["mvp", "most valuable"] },
      { key: "best_defender", name: "🛡️ Best Defender of the Tournament", searchKeyword: ["defender", "best defender"] }
    ],
    table_tennis: [
      { key: "singles_champion", name: "🥇 Table Tennis Singles Champion (Gold)", searchKeyword: ["singles champion", "singles gold", "champion", "single champion"] },
      { key: "singles_runner_up", name: "🥈 Singles Runner-up", searchKeyword: ["runner-up", "silver", "second place"] },
      { key: "most_determined", name: "🔥 Most Determined Smasher", searchKeyword: ["determined", "smasher", "willpower"] },
      { key: "fair_play", name: "🤝 Best Fair Play Award", searchKeyword: ["fair play", "sportsmanship", "fairplay"] }
    ],
    volleyball: [
      { key: "mvp", name: "⭐ Volleyball Tournament MVP", searchKeyword: ["mvp", "most valuable"] },
      { key: "best_server", name: "⚡ Best Server Award", searchKeyword: ["server", "best server", "ace"] },
      { key: "best_spiker", name: "💥 Best Opposite Spiker", searchKeyword: ["spiker", "attacker", "spike"] },
      { key: "best_libero", name: "🛡️ Best Libero / Defensive Master", searchKeyword: ["libero", "defender", "dig"] }
    ],
    athletics: [
      { key: "fastest_sprinter_100", name: "🏃 Fastest Male Sprinter (100m Gold)", searchKeyword: ["100m", "dash", "sprint", "fastest male"] },
      { key: "fastest_sprinter_200", name: "⚡ Fastest Female Sprinter (200m Gold)", searchKeyword: ["200m", "sprinter", "fastest female"] },
      { key: "best_relay", name: "🤝 4x100m Relay Gold Medal Winners", searchKeyword: ["relay", "team"] },
      { key: "rising_star", name: "🌟 Rising Star Track Athlete", searchKeyword: ["rising star", "future", "prospect", "rising"] }
    ]
  };

  const currentSportAwards = SPORT_AWARDS_CATALOG[awardSport] || [];

  const mappedAwards = currentSportAwards.map((cat) => {
    const match = awards.find((a) => {
      if (a.sport !== awardSport) return false;
      const awardNameLower = a.name.toLowerCase();
      const catNameLower = cat.name.toLowerCase();
      const catKeyLower = cat.key.replace(/_/g, " ");
      return (
        awardNameLower.includes(catNameLower) ||
        awardNameLower.includes(catKeyLower) ||
        cat.searchKeyword.some((kw) => awardNameLower.includes(kw))
      );
    });
    return {
      categoryKey: cat.key,
      categoryName: cat.name,
      match
    };
  });

  const standardMatchedIds = mappedAwards
    .map((m) => m.match?.id)
    .filter((id): id is string => !!id);

  const customAwards = awards.filter(
    (a) => a.sport === awardSport && !standardMatchedIds.includes(a.id)
  );

  const awardSportsOptions = [
    { key: "football", label: "⚽ Football" },
    { key: "table_tennis", label: "🏓 Table Tennis" },
    { key: "volleyball", label: "🏐 Volleyball" },
    { key: "athletics", label: "🏃 Athletics" }
  ];

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "TBD";
  };

  const showVenueMap = (venueName: string) => {
    if (!onSelectVenue || !onSetNavTab) return;
    
    let id = "main-gate";
    if (venueName.toLowerCase().includes("football")) id = "fb-stadium";
    else if (venueName.toLowerCase().includes("tennis") || venueName.toLowerCase().includes("pavilion")) id = "tt-hall";
    else if (venueName.toLowerCase().includes("volleyball") || venueName.toLowerCase().includes("court")) id = "vb-court";
    else if (venueName.toLowerCase().includes("track") || venueName.toLowerCase().includes("running")) id = "at-track";
    
    onSelectVenue(id);
    onSetNavTab("map");
  };

  return (
    <div className={`w-full flex flex-col gap-10 font-sans transition-colors duration-200 relative ${
      theme === "dark" ? "text-gray-200" : "text-slate-800"
    }`}>
      {copiedMessage && (
        <div className="fixed bottom-5 right-5 z-50 border border-emerald-500/25 bg-zinc-950 text-emerald-405 text-emerald-400 text-xs font-mono font-black py-2.5 px-4 rounded-xl shadow-lg border-l-4 border-l-emerald-500 flex items-center gap-2">
          <span>✔️</span>
          <span>{copiedMessage}</span>
        </div>
      )}
      
      {/* 1. TOURNAMENT LEADERBOARD (UNBOXED AND OPENED UP TO SPACE OUT ACCORDING TO USER PREFERENCE) */}
      <div className="w-full text-left">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/25">
          <h4 className={`text-sm font-sans font-black uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-amber-400" : "text-amber-850 text-amber-805"}`}>
            <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
            {sport === "athletics" ? "Athletic Club Leaderboard" : "Tournament Standings Rank"}
          </h4>
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded font-bold ${
            theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-900"
          }`}>
            Overall Standings
          </span>
        </div>

        {filteredTeams.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border-2 border-dashed italic text-xs ${
            theme === "dark" ? "bg-black/30 border-amber-500/10 text-gray-500" : "bg-slate-50 border-amber-200 text-slate-400"
          }`}>
            No competing Parishes or Clubs registered for this sport category. Admin can configure parishes in settings.
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`font-mono text-[10px] tracking-wider uppercase border-b ${
                  theme === "dark" ? "border-amber-500/20 text-amber-450/80" : "border-amber-200 text-amber-900"
                }`}>
                  <th className="py-3 px-1">RANK</th>
                  <th className="py-3">PARISH / CLUB</th>
                  {sport !== "athletics" ? (
                    <>
                      <th className="py-3 text-center hidden sm:table-cell">PL</th>
                      <th className="py-3 text-center hidden sm:table-cell">W</th>
                      {sport === "football" && <th className="py-3 text-center hidden sm:table-cell">D</th>}
                      <th className="py-3 text-center hidden sm:table-cell">L</th>
                      <th className="py-3 text-right font-black text-amber-500">PTS</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 text-center text-amber-500">GOLD</th>
                      <th className="py-3 text-center text-slate-400 hidden sm:table-cell">SILV</th>
                      <th className="py-3 text-center text-amber-700 hidden sm:table-cell">BRON</th>
                      <th className="py-3 text-right font-black text-amber-500">SCORE</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === "dark" ? "divide-amber-500/10" : "divide-amber-150"}`}>
                {filteredTeams.map((team, idx) => {
                  const isRankedOne = idx === 0;
                  return (
                    <tr key={team.id} className={`transition-all ${theme === "dark" ? "hover:bg-amber-500/5" : "hover:bg-amber-50/40"}`}>
                      <td className="py-4 px-1">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black border ${
                          isRankedOne 
                            ? theme === "dark"
                              ? "bg-amber-500/20 border-amber-500/80 text-amber-400"
                              : "bg-amber-100 border-amber-400 text-amber-950"
                            : theme === "dark"
                              ? "text-gray-400 border-zinc-800"
                              : "text-slate-600 border-slate-200"
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className={`py-4 font-bold ${theme === "dark" ? "text-gray-100" : "text-slate-900"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 ${team.logoColor}`} />
                          <div>
                            <span className="block text-sm font-sans font-extrabold whitespace-normal">{team.name}</span>
                            {team.isSuspended && (
                              <span className="text-[8px] tracking-widest font-mono text-red-500 bg-red-500/10 px-1 py-0.2 rounded font-bold uppercase">SUSPENDED</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {sport !== "athletics" ? (
                        <>
                          <td className="py-4 text-center text-gray-400 font-mono font-medium hidden sm:table-cell">{team.played}</td>
                          <td className="py-4 text-center text-gray-400 font-mono font-medium hidden sm:table-cell">{team.won}</td>
                          {sport === "football" && <td className="py-4 text-center text-gray-400 font-mono font-medium hidden sm:table-cell">{team.drawn}</td>}
                          <td className="py-4 text-center text-gray-400 font-mono font-medium hidden sm:table-cell">{team.lost}</td>
                          <td className={`py-4 text-right font-mono font-black text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>{team.points}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 text-center text-amber-500 font-mono font-extrabold text-sm">{(team.stats.golds as number) || 0}</td>
                          <td className="py-4 text-center text-slate-400 font-mono font-medium hidden sm:table-cell">{(team.stats.silvers as number) || 0}</td>
                          <td className="py-4 text-center text-amber-700 font-mono font-medium hidden sm:table-cell">{(team.stats.bronzes as number) || 0}</td>
                          <td className={`py-4 text-right font-mono font-black text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>{team.points}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={`text-[10px] mt-4 border-t pt-3 flex items-center gap-1.5 leading-relaxed font-sans ${
          theme === "dark" ? "text-amber-400/80 border-amber-500/20" : "text-amber-900/90 border-amber-250"
        }`}>
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
          <span>
            {sport === "football" && "Games System: 3 pts for Win, 1 pt for Draw. Goals Difference is first tiebreaker. Standings simplify columns on small mobile devices."}
            {sport === "athletics" && "Sprints Points: 5 pts per Gold medal, 3 pts per Silver medal, 2 pts per Bronze medal."}
            {(sport === "table_tennis" || sport === "volleyball") && "Volleyball & Table tennis: 2 pts for Win, 0 for Loss. Playoff trees updated dynamically."}
            {!["football", "table_tennis", "volleyball", "athletics"].includes(sport) && "Dynamic game rule: standard tournament matchups, results handled by coordinator."}
          </span>
        </div>
      </div>

      {/* 2. MATCHES & FIXTURES PANEL (UNBOXED AND OPENED UP TO SPACE OUT ACCORDING TO USER PREFERENCE) */}
      <div className="w-full text-left">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-500/25">
            <h4 className={`text-sm font-sans font-black uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-amber-400" : "text-amber-850 text-amber-805"}`}>
              <Calendar className="w-4 h-4 text-amber-500" /> Matches & Fixtures Schedule
            </h4>
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded font-bold ${
              theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-900"
            }`}>
              {filteredMatches.length} Matches Schedule
            </span>
          </div>

          {filteredMatches.length === 0 ? (
            <div className={`p-16 text-center rounded-2xl border-2 border-dashed italic text-xs ${
              theme === "dark" ? "bg-black/30 border-amber-500/15 text-gray-500" : "bg-slate-50 border-amber-200 text-slate-400"
            }`}>
              <div className="text-3xl mb-2.5">🏟️</div>
              <div className="font-sans font-black uppercase tracking-wider mb-1 text-amber-500">No match scheduled yet</div>
              <p className="text-[11px] leading-relaxed text-gray-400 font-mono">Organizers have not configured any matches for this sport. Turn on Admin view, login and seeder.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredMatches.map((match) => {
                const isLive = match.status === "live";
                const isFinished = match.status === "finished";

                return (
                  <div
                    key={match.id}
                    className={`py-5 border-b last:border-b-0 relative transition-all ${
                      isLive
                        ? theme === "dark"
                          ? "bg-amber-500/5 px-4 rounded-xl border border-amber-500/35 my-2 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          : "bg-amber-50/40 px-4 rounded-xl border border-amber-400/60 my-2 shadow-sm"
                        : "border-zinc-800/10 dark:border-zinc-800/40"
                    }`}
                  >
                    {/* Live indicator tag */}
                    {isLive && (
                      <span className="absolute top-1.5 right-1 px-2 py-0.5 bg-red-650 bg-red-650/10 border border-red-500 text-red-500 text-[8.5px] font-mono font-black rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-650 rounded-full inline-block" />
                        LIVE {match.livePeriod || ""} {match.liveTime || ""}
                      </span>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Left: Stage, Time and Date info */}
                      <div className="text-left w-full md:w-1/4 shrink-0">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${theme === "dark" ? "text-amber-400" : "text-amber-750 text-amber-700"}`}>
                          {match.stage.replace("_", " ")}
                        </span>
                        <span className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-slate-500 font-medium"}`}>
                          {match.time} • {match.date.split(",")[0]}
                        </span>
                      </div>

                      {/* Center: Dual Team Alignment & Scores Arranged Cleanly Horizontally */}
                      <div className="flex-1 flex items-center justify-center gap-4 w-full md:w-auto">
                        {sport === "athletics" ? (
                          <div className="w-full text-center py-1">
                            {isFinished && match.runners && match.runners.length > 0 ? (
                              <div className="flex flex-wrap gap-2 justify-center items-center">
                                {match.runners.slice(0, 3).map((runner) => (
                                  <span key={runner.playerId} className={`text-xs px-2.5 py-1 rounded bg-black/10 border border-white/5 font-sans font-bold ${theme === "dark" ? "text-gray-300" : "text-slate-800"}`}>
                                    🏅 {runner.rank}. {runner.playerName} ({runner.timeSeconds}s)
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={`font-mono italic text-[11px] ${theme === "dark" ? "text-amber-400/50" : "text-amber-805/60"}`}>Running Heats in progress</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between gap-3 md:gap-8">
                            {/* Team A complete name and Logo */}
                            <div className="flex items-center gap-3 flex-1 justify-end text-right min-w-0">
                              <span className={`text-sm sm:text-base font-sans font-black tracking-tight whitespace-normal break-words leading-tight ${theme === "dark" ? "text-gray-100" : "text-slate-900"}`}>
                                {getTeamName(match.teamAId)}
                              </span>
                              <TeamLogo team={teams.find(t => t.id === match.teamAId)} theme={theme} />
                            </div>

                            {/* Elevated Score Center Pill */}
                            <div className="shrink-0 flex items-center justify-center">
                              {isFinished || isLive ? (
                                <span className={`text-xs sm:text-sm font-mono font-black border-2 px-3 py-1.5 rounded-xl leading-none tracking-wider ${
                                  theme === "dark"
                                    ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                    : "text-amber-950 bg-amber-100 border-amber-300"
                                }`}>
                                  {match.scoreA} : {match.scoreB}
                                </span>
                              ) : (
                                <span className={`text-[10px] font-mono border px-3 py-1.5 rounded-lg leading-none uppercase tracking-wider ${
                                  theme === "dark" ? "bg-zinc-900 border-zinc-800 text-gray-500" : "bg-white border-slate-200 text-slate-400"
                                }`}>
                                  vs
                                </span>
                              )}
                            </div>

                            {/* Team B complete name and Logo */}
                            <div className="flex items-center gap-3 flex-1 justify-start text-left min-w-0">
                              <TeamLogo team={teams.find(t => t.id === match.teamBId)} theme={theme} />
                              <span className={`text-sm sm:text-base font-sans font-black tracking-tight whitespace-normal break-words leading-tight ${theme === "dark" ? "text-gray-100" : "text-slate-900"}`}>
                                {getTeamName(match.teamBId)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Venue and Directions Action */}
                      <div className="text-right w-full md:w-1/4 shrink-0 flex flex-col md:items-end justify-start md:justify-end gap-1.5 text-xs">
                        <span className={`font-sans truncate ${theme === "dark" ? "text-gray-400" : "text-slate-505 text-slate-500"}`}>📍 {match.venue}</span>
                        <div className="flex items-center justify-start md:justify-end gap-2 text-xs">
                          <button
                            onClick={() => showVenueMap(match.venue)}
                            className="text-amber-500 hover:text-amber-600 font-mono font-black flex items-center gap-0.5 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            Trace <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-zinc-650/40">•</span>
                          <button
                            onClick={() => handleShareMatch(match)}
                            className="text-blue-500 hover:text-blue-400 font-sans font-black flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap"
                            title="Share Scorecard"
                          >
                            <Share2 className="w-3 h-3 text-blue-500" /> Share
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: ALLOCATED AWARDS & SPECIAL MEDALS SHOWCASE (UNBOXED PER USER REQUEST) */}
      <div className="w-full text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-zinc-500/25 text-left">
          <div>
            <h4 className={`text-sm font-sans font-black uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-amber-400" : "text-amber-850 text-amber-805"}`}>
              <AwardIcon className="w-4 h-4 text-amber-500" /> Allocated Awards & Medals Showcase
            </h4>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Explore active honor boards and official winner rosters by selecting a category.</p>
          </div>

          {/* Clickable Sports Filter pills */}
          <div className={`flex flex-wrap gap-1.5 p-1 rounded-xl border ${
            theme === "dark" ? "bg-black/40 border-zinc-800" : "bg-slate-100 border-slate-205"
          }`}>
            {awardSportsOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAwardSport(opt.key)}
                className={`text-[10px] uppercase font-mono font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                  awardSport === opt.key
                    ? "bg-amber-500 text-black shadow-md font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-300 hover:text-amber-400 hover:bg-white/5"
                      : "text-slate-700 hover:text-amber-800 hover:bg-black/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Grid for selected sport */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mappedAwards.map((mapped) => {
            const hasWinner = !!mapped.match;
            return (
              <div
                key={mapped.categoryKey}
                className={`p-4 rounded-xl border flex gap-3 items-start relative overflow-hidden transition-all duration-300 ${
                  hasWinner
                    ? theme === "dark"
                      ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-400/60"
                      : "bg-amber-50/40 border-amber-250 shadow-sm hover:border-amber-400"
                    : theme === "dark"
                      ? "bg-black/10 border-dashed border-zinc-800 hover:border-zinc-700"
                      : "bg-slate-50/50 border-dashed border-slate-205 shadow-none"
                }`}
              >
                {/* Trophy or Lock Icon wrapper */}
                <div className={`p-2.5 rounded-xl shadow-lg transition-transform duration-300 ${
                  hasWinner
                    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black scale-102"
                    : theme === "dark"
                      ? "bg-zinc-900 border border-zinc-800/85 text-zinc-650"
                      : "bg-slate-100 border border-slate-200 text-slate-400"
                }`}>
                  {hasWinner ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-500 opacity-60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono border rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider ${
                      hasWinner
                        ? theme === "dark"
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : "bg-amber-50 border-amber-300 text-amber-900"
                        : theme === "dark"
                          ? "bg-zinc-900 border-zinc-800 text-gray-500"
                          : "bg-slate-100 border-slate-250 text-slate-500"
                    }`}>
                      {mapped.categoryName}
                    </span>
                    {hasWinner && (
                      <span className="text-[9px] font-mono font-black text-amber-500 flex items-center gap-0.5 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CONFERRED
                      </span>
                    )}
                  </div>

                  {hasWinner ? (
                    <div className="mt-2 text-left">
                      <h5 className={`text-md font-sans font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        🏅 {mapped.match?.recipientName}
                      </h5>
                      {mapped.match?.teamName && (
                        <p className={`text-[10px] font-mono mt-0.5 font-bold uppercase tracking-wider ${theme === "dark" ? "text-amber-400/80" : "text-amber-900"}`}>
                          🛡️ {mapped.match?.teamName}
                        </p>
                      )}
                      {mapped.match?.details && (
                        <p className={`text-[11px] font-sans italic leading-relaxed mt-1.5 ${theme === "dark" ? "text-gray-300" : "text-slate-600"}`}>
                          {mapped.match?.details}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-left">
                      <h5 className={`text-xs font-mono font-black italic uppercase leading-none ${theme === "dark" ? "text-zinc-650" : "text-slate-400"}`}>
                        ⚔️ Awaiting Release
                      </h5>
                      <p className={`text-[10.5px] font-sans leading-relaxed mt-1 text-gray-400 ${theme === "dark" ? "text-zinc-500/90" : "text-slate-400"}`}>
                        This award is currently empty. The admin/coordinator has not yet conferred this medal name onto any participant roster.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional custom awards defined by admin */}
        {customAwards.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/5 text-left">
            <span className="text-[9.5px] font-mono uppercase tracking-widest text-amber-500 font-extrabold block mb-3">
              🌟 SPECIAL MEDALS & HONORARY MENTIONS
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customAwards.map((award) => (
                <div
                  key={award.id}
                  className={`p-3.5 rounded-xl border flex gap-3 items-start relative overflow-hidden ${
                    theme === "dark" ? "bg-black/30 border-zinc-800 hover:border-amber-500/40" : "bg-slate-50 border-slate-205 shadow-sm"
                  }`}
                >
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-black rounded-lg shadow-lg">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-[9.5px] font-mono px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider ${
                      theme === "dark" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-900"
                    }`}>
                      {award.name}
                    </span>
                    <h5 className={`text-xs font-extrabold mt-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      🏅 {award.recipientName}
                    </h5>
                    {award.teamName && (
                      <p className={`text-[10.5px] font-sans mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500 font-medium"}`}>{award.teamName}</p>
                    )}
                    {award.details && (
                      <p className={`text-[10.5px] font-sans italic leading-relaxed mt-1 ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}>{award.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CHAMPS AUDIO-VISUAL & MEMORY CONTAINER (UNBOXED PER USER REQUEST) */}
      <div className="w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-500/25 pb-2 mb-4 gap-4">
          <div>
            <span className="text-[9px] font-mono tracking-wider font-extrabold text-amber-500 block">LIVE MATCH BROADCASTS & STREAMING</span>
            <h3 className={`text-sm font-sans font-black uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-amber-400" : "text-amber-850 text-amber-805"}`}>
              📺 CASSA OLYMPIC MEDIA HUB
            </h3>
            <p className="text-[11px] text-gray-400 font-mono mt-1">Live match captures and dynamically updated video feeds from active parishes.</p>
          </div>

          {/* Quick Category Filters */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border self-stretch sm:self-auto justify-center ${
            theme === "dark" ? "bg-black/40 border-zinc-800" : "bg-slate-100 border-slate-200"
          }`}>
            {(["all", "live", "recent", "upcoming"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setMediaFilter(filter)}
                className={`text-[10px] uppercase font-mono font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                  mediaFilter === filter
                    ? "bg-amber-500 text-black shadow-md font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-300 hover:text-amber-400 hover:bg-white/5"
                      : "text-slate-700 hover:text-amber-800 hover:bg-black/5"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Media items empty check */}
        {mediaPosts.filter(m => mediaFilter === "all" || m.category === mediaFilter).length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-zinc-850 rounded-xl italic text-xs text-gray-500 font-mono">
            📭 No media items categorized under '{mediaFilter}' for {sport.toUpperCase()} yet. Let the admin share some snaps!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaPosts
              .filter(m => mediaFilter === "all" || m.category === mediaFilter)
              .map((post) => {
                const userHasLiked = currentUser && post.likes && post.likes.includes(currentUser.username);
                return (
                  <div 
                    key={post.id}
                    className={`rounded-2xl overflow-hidden border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between ${
                      theme === "dark" ? "bg-[#141517] border-zinc-900" : "bg-slate-50 border-amber-100"
                    }`}
                  >
                    {/* Media Type container preview */}
                    <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                      {post.mediaType === "video" ? (
                        <iframe 
                          src={post.url} 
                          title={post.title}
                          className="absolute inset-0 w-full h-full border-0 rounded-t-2xl"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : post.mediaType === "audio" ? (
                        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-amber-950/40 via-zinc-950 to-zinc-950 rounded-t-2xl">
                          <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-xs animate-spin" style={{ animationDuration: "5s" }}>
                              📻
                            </div>
                            <div className="text-left">
                              <span className="text-[9px] font-mono tracking-wider font-extrabold text-amber-500 block leading-none">AUDIO PLAYBACK</span>
                              <span className="text-[11px] font-sans text-gray-300 font-bold leading-none block mt-1">Official CASSA Audio/Sound Clip</span>
                            </div>
                          </div>
                          
                          <audio 
                            src={post.url} 
                            controls 
                            className="w-full mt-2 focus:outline-none accent-amber-500 text-xs bg-transparent"
                          />
                        </div>
                      ) : (
                        <img 
                          src={post.url} 
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      )}
                      
                      {/* Category Pill Tag */}
                      <span className={`absolute top-3 left-3 text-[8.5px] font-mono tracking-widest uppercase font-black px-2 py-0.5 rounded border shadow-lg ${
                        post.category === "live" 
                          ? "bg-red-600 border-red-500 text-white animate-pulse" 
                          : post.category === "recent"
                            ? "bg-amber-500 border-amber-600 text-black"
                            : "bg-zinc-800 border-zinc-700 text-amber-400"
                      }`}>
                        {post.category}
                      </span>

                      {/* Overlay indicator */}
                      {post.mediaType === "video" && (
                        <span className="absolute bottom-3 right-3 text-[8px] font-mono uppercase bg-black/80 px-2 py-0.5 rounded text-white font-bold tracking-widest flex items-center gap-1.5 pointer-events-none">
                          <Play className="w-2.5 h-2.5 fill-white text-white" /> DIGITAL REEL
                        </span>
                      )}
                      {post.mediaType === "audio" && (
                        <span className="absolute bottom-3 right-3 text-[8px] font-mono uppercase bg-black/80 px-2 py-0.5 rounded text-white font-bold tracking-widest flex items-center gap-1.5 pointer-events-none">
                          🔊 MEMORY CHORD
                        </span>
                      )}
                    </div>

                    {/* Media metadata and description */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        {post.matchId && (
                          <div className="text-[9px] font-mono text-amber-500 font-extrabold uppercase tracking-widest leading-none mb-1">
                            MATCH CORRELATION: {post.matchId.replace("match-", "").toUpperCase()}
                          </div>
                        )}
                        <h4 className={`text-sm font-sans font-black leading-snug line-clamp-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          {post.title}
                        </h4>
                        <div className="text-[10px] text-gray-400 mt-1.5 font-sans">
                          Published by <span className="font-bold text-amber-500">{post.author}</span> • {post.timestamp}
                        </div>
                      </div>

                      {/* Interactive Emojis Reaction Bar */}
                      <div className="border-t border-zinc-800/20 dark:border-zinc-800/60 pt-3 mt-4">
                        <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase font-black block mb-2">
                          REACT WITH EMOTIONS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {["👍", "🔥", "😅", "👏", "😭", "😕"].map((emoji) => {
                            const reactorList = post.reactions?.[emoji] || [];
                            const userHasReacted = anonUserId ? reactorList.includes(anonUserId) : false;
                            const count = reactorList.length;

                            return (
                              <button
                                key={emoji}
                                onClick={() => onReactPost?.(post.id, emoji)}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer hover:scale-105 active:scale-95 ${
                                  userHasReacted
                                    ? "bg-amber-500/15 border-amber-500/70 text-amber-450 text-amber-500"
                                    : theme === "dark"
                                      ? "bg-black/30 border-zinc-850 hover:border-zinc-750 text-zinc-400"
                                      : "bg-slate-50 border-slate-205 hover:border-slate-350 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-mono">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

    </div>
  );
}
