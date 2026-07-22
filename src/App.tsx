import React, { useState, useEffect, useRef } from "react";
import { TournamentDb, SportType, UserRole, PushNotification } from "./types";
import { defaultDb } from "./db_seed";
import Countdown from "./components/Countdown";
import ParishStandings from "./components/ParishStandings";
import SportDashboard from "./components/SportDashboard";
import AdminPanel from "./components/AdminPanel";
import {
  Trophy,
  Activity,
  Compass,
  Bell,
  Settings,
  Flame,
  Calendar,
  X,
  Shield,
  CircleAlert,
  ArrowUpRight,
  Info,
  Search
} from "lucide-react";

interface ToastAlert extends PushNotification {
  toastId: number;
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Primary database state
  const [db, setDb] = useState<TournamentDb>(defaultDb);
  const [activeTab, setActiveTab] = useState<"dashboard" | "map" | "alerts" | "admin">("dashboard");
  const [selectedSport, setSelectedSport] = useState<SportType>("football");
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem("cassa_user_role") as UserRole;
      return saved || "spectator";
    } catch {
      return "spectator";
    }
  });
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [showNotificationBellBadge, setShowNotificationBellBadge] = useState(false);
  
  // User login and membership state
  const [currentUser, setCurrentUser] = useState<{ username: string; nickname: string } | null>(() => {
    try {
      const saved = localStorage.getItem("cassa_current_user");
      return saved ? JSON.parse(saved) : { username: "Guest", nickname: "Guest Spectator" };
    } catch {
      return { username: "Guest", nickname: "Guest Spectator" };
    }
  });

  const [anonUserId] = useState<string>(() => {
    try {
      let id = localStorage.getItem("cassa_anon_id");
      if (!id) {
        id = "anon_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("cassa_anon_id", id);
      }
      return id;
    } catch {
      return "anon_" + Math.random().toString(36).substring(2, 11);
    }
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modernized Welcome Page loading state
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeProgress, setWelcomeProgress] = useState(0);
  const [welcomeStatus, setWelcomeStatus] = useState("Initializing secure terminal...");

  // Backward-compatibility references for disabled layouts
  const setShowAuthModal = (v: boolean) => {};
  const setAuthError = (s: string) => {};
  const setAuthSuccess = (s: string) => {};
  const setAuthTab = (s: string) => {};
  const authTab = "login" as string;
  const authError = "";
  const authSuccess = "";
  const handleOfficialLogin = (...args: any[]) => {};
  const handleOfficialSignUp = (...args: any[]) => {};
  const authEmail = "";
  const authUsername = "";
  const authNickname = "";
  const authPassword = "";
  const setAuthEmail = (s: string) => {};
  const setAuthUsername = (s: string) => {};
  const setAuthNickname = (s: string) => {};
  const setAuthPassword = (s: string) => {};
  const showAuthModal = false;



  const handleLikePost = async (postId: string) => {
    const cleanUser = anonUserId || "anon_spectator";
    const postsList = db.mediaPosts || [];
    
    const updatedMedia = postsList.map(post => {
      if (post.id === postId) {
        const likesArr = post.likes || [];
        const hasLiked = likesArr.includes(cleanUser);
        const nextLikes = hasLiked 
          ? likesArr.filter((u: string) => u !== cleanUser)
          : [...likesArr, cleanUser];
        return { ...post, likes: nextLikes };
      }
      return post;
    });

    const newDb = { ...db, mediaPosts: updatedMedia, version: db.version + 1 };
    await handleUpdateDbState(newDb);
  };
  
  // Keep track of total notification counts to catch increments
  const prevNotifCountRef = useRef<number>(0);
  const selectedVenueRef = useRef<string>("fb-stadium");

  // Fetch Tournament Data from Express API
  const fetchTournamentData = async () => {
    try {
      const response = await fetch("/api/tournament-data");
      if (response.ok) {
        const newData = (await response.json()) as TournamentDb;
        
        // Push notification detection
        const prevCount = prevNotifCountRef.current;
        const currentCount = newData.notifications.length;

        if (prevCount > 0 && currentCount > prevCount) {
          // Identify newly generated notifications
          const newNotifs = newData.notifications.slice(0, currentCount - prevCount);
          
          // Feed to in-app toasts immediately
          newNotifs.forEach((item, idx) => {
            const toastId = Date.now() + Math.random() + idx;
            setToasts((prev) => [...prev, { ...item, toastId }]);
            
            // Automatically clear toast alert bubble after 5.5 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
            }, 5500);
          });

          // Toggle notification alert indicators
          setShowNotificationBellBadge(true);
        }

        prevNotifCountRef.current = currentCount;
        setDb(newData);
      }
    } catch (err) {
      console.warn("Express endpoint backend offline/building. Operating Local Fallback State.", err);
    }
  };

  // Mount polling synchronization interval
  useEffect(() => {
    fetchTournamentData();
    // Poll the backend every 3.5 seconds to sync multiplayer scores or administrative updates
    const pollInterval = setInterval(fetchTournamentData, 3500);
    return () => clearInterval(pollInterval);
  }, []);

  // Welcome screen loading timer effect
  useEffect(() => {
    if (!showWelcome) return;
    
    const statuses = [
      "Initializing secure portal terminal...",
      "Connecting to Calabar Archdiocesan scoreboard...",
      "Syncing St. Patrick's and competitor parish stand records...",
      "Retrieving live athletic tournament fixtures...",
      "Preparing telemetry results grid...",
      "Ready to Enter Olympic Arena!"
    ];

    const interval = setInterval(() => {
      setWelcomeProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setWelcomeStatus("Welcome! Connection Established.");
          return 100;
        }
        
        // Update status text based on progress
        const statusIdx = Math.min(
          Math.floor((next / 100) * statuses.length),
          statuses.length - 1
        );
        setWelcomeStatus(statuses[statusIdx]);
        
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [showWelcome]);

  // Request for passcode authentication every time the admin leaves the console tab
  useEffect(() => {
    if (activeTab !== "admin" && userRole === "admin") {
      setUserRole("spectator");
      localStorage.setItem("cassa_user_role", "spectator");
    }
  }, [activeTab, userRole]);

  // Update backend database State
  const handleUpdateDbState = async (updatedDb: TournamentDb) => {
    setDb(updatedDb);
    try {
      await fetch("/api/update-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
    } catch (err) {
      console.error("Failed to sync database state with Express server:", err);
    }
  };

  // Reseed default data
  const handleResetData = async () => {
    if (confirm("Are you sure you want to revert all custom tournaments, match scoring edits, and medals and re-apply seed starting fixtures?")) {
      try {
        const response = await fetch("/api/reset-data", { method: "POST" });
        if (response.ok) {
          const res = await response.json();
          setDb(res.db);
          prevNotifCountRef.current = res.db.notifications.length;
          setToasts([]);
          alert("Tournament database reseeded to initial state successfully!");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualRemoveToast = (toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const handleReactPost = async (postId: string, emoji: string) => {
    try {
      const response = await fetch("/api/react-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, emoji, userId: anonUserId })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.db) {
          setDb(data.db);
        }
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  // Live Matches Filter
  const liveMatches = db.matches.filter((m) => m.status === "live");

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "Athlete";
    const team = db.teams.find((t) => t.id === teamId);
    return team ? team.name : "TBD";
  };

  const getSearchResults = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchingMatches = db.matches.filter(m => {
      const teamAName = getTeamName(m.teamAId).toLowerCase();
      const teamBName = m.teamBId ? getTeamName(m.teamBId).toLowerCase() : "";
      return m.sport.toLowerCase().includes(q) ||
        m.stage.toLowerCase().includes(q) ||
        m.venue.toLowerCase().includes(q) ||
        teamAName.includes(q) ||
        teamBName.includes(q);
    });

    const matchingTeams = db.teams.filter(t => {
      return t.name.toLowerCase().includes(q) || t.sport.toLowerCase().includes(q);
    });

    const matchingPlayers = db.players.filter(p => {
      const teamName = getTeamName(p.teamId).toLowerCase();
      return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.sport.toLowerCase().includes(q) || teamName.includes(q);
    });

    const matchingAlerts = db.notifications.filter(n => {
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.sport && n.sport.toLowerCase().includes(q));
    });

    const matchingMedia = (db.mediaPosts || []).filter(post => {
      return post.title.toLowerCase().includes(q) || post.category.toLowerCase().includes(q) || post.mediaType.toLowerCase().includes(q);
    });

    return {
      matches: matchingMatches.slice(0, 5),
      teams: matchingTeams.slice(0, 5),
      players: matchingPlayers.slice(0, 8),
      alerts: matchingAlerts.slice(0, 5),
      media: matchingMedia.slice(0, 5),
      totalCount: matchingMatches.length + matchingTeams.length + matchingPlayers.length + matchingAlerts.length + matchingMedia.length
    };
  };

  const searchResults = getSearchResults();

  const sportInfo = {
    football: "Football Cup",
    table_tennis: "Table Tennis Singles",
    volleyball: "Volleyball Open",
    athletics: "Athletics Sprints"
  };

  if (false) {
    return null;
  }

  if (showWelcome) {
    return (
      <div id="welcome-screen" className={`min-h-screen flex flex-col items-center justify-between py-10 px-6 relative overflow-hidden transition-colors duration-500 ${
        theme === "dark" 
          ? "bg-[#030712] text-zinc-100" 
          : "bg-[#f8fafc] text-slate-900"
      }`}>
        {/* Subtle Ambient Glowing Background Orbs */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full filter blur-[128px] opacity-20 transition-colors duration-500 ${
          theme === "dark" ? "bg-amber-500" : "bg-amber-300"
        }`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full filter blur-[128px] opacity-20 transition-colors duration-500 ${
          theme === "dark" ? "bg-yellow-500" : "bg-yellow-300"
        }`} />
        
        {/* Top Spacer for vertical balance */}
        <div className="w-full h-2 shrink-0" />

        {/* Main Content Card */}
        <div className="max-w-md w-full text-center relative z-10 flex flex-col items-center my-auto">
          {/* Logo Container with rotating outline or glowing ring */}
          <div className="relative mb-6 group">
            <div className={`absolute -inset-2 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition duration-1000 ${
              theme === "dark" ? "bg-gradient-to-r from-amber-500 to-yellow-500" : "bg-gradient-to-r from-amber-400 to-yellow-400"
            }`} />
            <div className={`relative w-28 h-28 rounded-full overflow-hidden border-2 shadow-2xl bg-zinc-950 flex items-center justify-center p-1.5 ${
              theme === "dark" ? "border-amber-500/50" : "border-amber-400"
            }`}>
              <img
                src="/altar_server_logo.jpg"
                alt="CASSA Altar Server Logo"
                className="w-full h-full object-cover rounded-full select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Pulsing crown/badge */}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1.5 rounded-full shadow-lg border border-amber-300 flex items-center justify-center animate-bounce">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Typography headers */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight uppercase leading-none">
              CASSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600">Olympic</span> Portal
            </h1>
            <p className="text-[10px] md:text-xs font-mono tracking-widest text-zinc-400 uppercase leading-relaxed max-w-xs mx-auto">
              Calabar Archdiocesan Altar Servers Association
            </p>
            <div className={`h-[1px] w-16 mx-auto ${
              theme === "dark" ? "bg-zinc-800" : "bg-slate-200"
            }`} />
          </div>

          {/* Interactive Loading and Entry UI */}
          <div className={`w-full p-6 rounded-2xl border backdrop-blur-sm transition-all shadow-xl ${
            theme === "dark" 
              ? "bg-zinc-900/40 border-zinc-800/80" 
              : "bg-white/80 border-slate-200/80"
          }`}>
            <div className="space-y-4">
              {/* Progress and status header */}
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-zinc-400 font-medium truncate max-w-[240px]">
                  {welcomeStatus}
                </span>
                <span className="text-amber-500 font-extrabold font-mono">
                  {welcomeProgress}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className={`h-2.5 w-full rounded-full overflow-hidden p-[2px] ${
                theme === "dark" ? "bg-black/60" : "bg-slate-100"
              }`}>
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  style={{ width: `${welcomeProgress}%` }}
                />
              </div>

              {/* Enter Button or Info message */}
              <div className="pt-2">
                {welcomeProgress < 100 ? (
                  <p className="text-[10.5px] font-sans text-zinc-500 italic">
                    Loading credentials and real-time scoreboard metrics...
                  </p>
                ) : (
                  <button
                    id="welcome-enter-btn"
                    onClick={() => {
                      setShowWelcome(false);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black py-3 px-6 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2"
                  >
                    Enter Official Portal <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Creator Footer in welcome page (Centered at the bottom of the page in flow) */}
        <div className="w-full text-center relative z-10 pt-6">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-sans text-zinc-400">
              Created by <span className={theme === "dark" ? "text-amber-400 font-semibold" : "text-amber-700 font-semibold"}>Thomas Adariku</span>
            </p>
          </div>
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            St. Patrick's Parish • CASSA 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans relative pb-20 transition-colors duration-200 ${
      theme === "dark" ? "bg-[#030712] text-zinc-100" : "bg-[#f8fafc] text-slate-950"
    }`}>
      
      {/* 1. TOP MARQUEE LIVE SCORES TICKER */}
      {liveMatches.length > 0 && (
        <div className={`w-full py-2.5 px-4 shadow-md flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-none sticky top-0 z-40 backdrop-blur-md border-b ${
          theme === "dark"
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-amber-50/90 border-amber-200"
        }`}>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600 border border-red-500 rounded text-zinc-100 text-[10px] font-mono font-extrabold antialiased animate-pulse flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
            LIVE TICKER
          </div>

          <div className="flex gap-4 items-center">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                className={`inline-flex items-center border rounded-lg px-2.5 py-1 text-xs gap-2 ${
                  theme === "dark"
                    ? "bg-zinc-950/90 border-zinc-800"
                    : "bg-white border-slate-200 shadow-sm text-slate-700"
                }`}
              >
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{match.sport === "table_tennis" ? "TT" : match.sport}</span>
                {match.sport === "athletics" ? (
                  <span className={`font-bold ${theme === "dark" ? "text-zinc-200" : "text-slate-800"}`}>{match.stage}: Running live Heats</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold truncate max-w-[80px] ${theme === "dark" ? "text-zinc-250" : "text-slate-800"}`}>{getTeamName(match.teamAId)}</span>
                    <span className={`font-mono font-black px-1.5 py-0.5 rounded border ${
                      theme === "dark"
                        ? "text-amber-400 bg-zinc-900 border-zinc-800"
                        : "text-amber-950 bg-amber-100 border-amber-350"
                    }`}>
                      {match.scoreA} : {match.scoreB}
                    </span>
                    <span className={`font-semibold truncate max-w-[80px] ${theme === "dark" ? "text-zinc-250" : "text-slate-800"}`}>{getTeamName(match.teamBId)}</span>
                  </div>
                )}
                {match.liveTime && (
                  <span className="text-[10px] text-red-500 font-mono font-bold animate-pulse">
                    {match.livePeriod || ""}: {match.liveTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. FIXED STICKY NAVIGATION HEADER */}
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-200 ${
        theme === "dark" 
          ? "bg-[#030712]/92 border-zinc-800/80 text-white shadow-lg" 
          : "bg-white/95 border-slate-200 text-slate-900 shadow-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Top-Left: Brand and Organization Title */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/20 shadow-md bg-zinc-950 flex-shrink-0 flex items-center justify-center">
                <img
                  src="/altar_server_logo.jpg"
                  alt="CASSA Altar Server Logo"
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <h1 className="text-base md:text-lg font-sans font-black tracking-tight flex items-center gap-1.5 leading-none">
                  CASSA <span className="text-amber-500 font-mono text-[9px] uppercase px-1.5 py-0.2 border border-amber-500/30 rounded">2026</span>
                </h1>
                <p className={`text-[9px] font-mono tracking-wider uppercase font-black mt-0.5 ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
                  CALABAR ARCHDIOCESAN ALTAR SERVERS ASSOCIATION NIGERIA
                </p>
              </div>
            </div>
          </div>
          {/* Top-Right: Unified Navigation Menu Bar */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto">
            
            {/* Desktop Navigation Link Tabs within the Menu Bar */}
            <div className="hidden lg:flex items-center gap-1 bg-black/10 dark:bg-black/40 p-1 rounded-xl border border-zinc-800/10 dark:border-zinc-800/60 font-mono">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-amber-505 bg-amber-500 text-black shadow-sm font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                ⚽ Results
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === "map"
                    ? "bg-amber-505 bg-amber-500 text-black shadow-sm font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                🛡️ Honor Roll
              </button>
              <button
                onClick={() => {
                  setActiveTab("alerts");
                  setShowNotificationBellBadge(false);
                }}
                className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer relative ${
                  activeTab === "alerts"
                    ? "bg-amber-505 bg-amber-500 text-black shadow-sm font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-slate-650 hover:text-slate-900 hover:bg-slate-205"
                }`}
              >
                📢 Alerts
                {showNotificationBellBadge && (
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full absolute top-[3px] right-1 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-amber-505 bg-amber-500 text-black shadow-sm font-extrabold"
                    : theme === "dark"
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-slate-650 hover:text-slate-900 hover:bg-slate-205"
                }`}
              >
                ⚙️ Console
              </button>
            </div>
            {/* STYLISH GLOBAL SEARCH INPUT BOX */}
            <div className="relative w-44 sm:w-56 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search parishes, athletes, alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-7 py-1.5 text-[11px] font-sans rounded-xl border focus:outline-none focus:border-amber-500 transition-all ${
                  theme === "dark"
                    ? "bg-black/40 border-zinc-800 text-white placeholder-zinc-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="h-5 w-px bg-zinc-800/20 dark:bg-zinc-800" />

            {/* Theme mode toggle button within menu bar */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`text-[10px] p-1.5 font-sans font-bold rounded-xl border flex items-center transition-all outline-none cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-800 text-yellow-450 hover:bg-zinc-800"
                  : "bg-white border-slate-205 text-slate-705 hover:bg-slate-50 shadow-sm"
              }`}
              aria-label="Toggle Theme Mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

          </div>
        </div>

        {/* Nested Live Scores Ticker - Beautifully flows inside the Sticky/Fixed Header container */}
        {liveMatches.length > 0 && (
          <div className={`w-full py-1.5 px-4 flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-none border-t ${
            theme === "dark"
              ? "bg-amber-500/5 border-zinc-850 text-white"
              : "bg-amber-50/50 border-slate-100 text-slate-400"
          }`}>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-650 bg-red-600 rounded text-zinc-100 text-[8.5px] font-mono font-extrabold antialiased animate-pulse flex-shrink-0">
              <span className="w-1 h-1 bg-white rounded-full inline-block" />
              LIVE TICKER
            </div>

            <div className="flex gap-3.5 items-center">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className={`inline-flex items-center border rounded-lg px-2.5 py-0.5 text-[10.5px] gap-2 ${
                    theme === "dark"
                      ? "bg-zinc-950 border-zinc-850/80"
                      : "bg-white border-slate-205 shadow-sm text-slate-700"
                  }`}
                >
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">{match.sport === "table_tennis" ? "TT" : match.sport}</span>
                  {match.sport === "athletics" ? (
                    <span className={`font-bold ${theme === "dark" ? "text-zinc-200" : "text-slate-800"}`}>{match.stage}: Running live Heats</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className={`font-bold truncate max-w-[80px] ${theme === "dark" ? "text-zinc-300" : "text-slate-800"}`}>{getTeamName(match.teamAId)}</span>
                      <span className={`font-mono font-black px-1.5 py-0.2 rounded border text-[10px] ${
                        theme === "dark"
                          ? "text-amber-400 bg-zinc-900 border-zinc-900/80"
                          : "text-amber-955 bg-amber-50 border-amber-250"
                      }`}>
                        {match.scoreA} : {match.scoreB}
                      </span>
                      <span className={`font-bold truncate max-w-[80px] ${theme === "dark" ? "text-zinc-300" : "text-slate-800"}`}>{getTeamName(match.teamBId)}</span>
                    </div>
                  )}
                  {match.liveTime && (
                    <span className="text-[9px] text-red-500 font-mono font-black animate-pulse">
                      {match.livePeriod || ""}: {match.liveTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* GLOBAL SEARCH RESULTS OVERLAY HERO PANEL */}
      {searchQuery.trim().length > 0 && searchResults && (
        <div className="w-full max-w-7xl mx-auto px-4 my-6">
          <div className={`p-6 rounded-3xl border shadow-2xl transition-all ${
            theme === "dark" 
              ? "bg-zinc-950/95 border-zinc-800 text-white" 
              : "bg-white/98 border-slate-205 text-slate-900 shadow-xl"
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-550/10 pb-4 mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 animate-pulse">
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-sans font-black">CASSA Dynamic Search Results</h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Matches found for &ldquo;<span className="text-amber-500 font-bold">{searchQuery}</span>&rdquo; — {searchResults.totalCount} items matching
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 hover:scale-[1.02] text-white font-mono text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                Clear Search ✕
              </button>
            </div>

            {searchResults.totalCount === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <p className="text-4xl mb-4">🔍</p>
                <h4 className="text-sm font-black uppercase tracking-wider">No Match Located</h4>
                <p className={`text-xs leading-relaxed mt-2.5 ${theme === "dark" ? "text-zinc-400" : "text-slate-550"}`}>
                  We couldn't find any parish teams, match cards, athlete names, alert details, or media elements for your filter. Try searching for "volleyball", "peter", "spiker", or "medal".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CATEGORY 1: PARISH STANDINGS */}
                {searchResults.teams.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/60 border-zinc-850" : "bg-slate-50 border-slate-200"}`}>
                    <h3 className="text-[11px] font-mono font-bold tracking-wider text-amber-500 uppercase mb-3 flex items-center justify-between">
                      <span>⛪ Parishes ({searchResults.teams.length})</span>
                      <span className="text-[9px] text-zinc-500">Standings</span>
                    </h3>
                    <div className="space-y-2">
                      {searchResults.teams.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setActiveTab("map");
                            setSearchQuery("");
                          }}
                          className={`p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-between hover:scale-[1.01] ${
                            theme === "dark" ? "bg-zinc-950/80 border-zinc-900 hover:border-zinc-800" : "bg-white border-slate-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span className="text-xs font-black">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                            <span>Score:</span>
                            <span className="font-mono bg-amber-500/10 text-amber-500 font-black px-1.5 rounded">{t.points} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 2: ATHLETES */}
                {searchResults.players.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/60 border-zinc-850" : "bg-slate-50 border-slate-200"}`}>
                    <h3 className="text-[11px] font-mono font-bold tracking-wider text-amber-500 uppercase mb-3 flex items-center justify-between">
                      <span>🏃 Athletes ({searchResults.players.length})</span>
                      <span className="text-[9px] text-zinc-500">Rosters</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {searchResults.players.map((p) => {
                        const parishTeam = db.teams.find(t => t.id === p.teamId);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActiveTab("map");
                              setSearchQuery("");
                            }}
                            className={`p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-between hover:scale-[1.01] ${
                              theme === "dark" ? "bg-zinc-950/80 border-zinc-900 hover:border-zinc-800" : "bg-white border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-extrabold">{p.name}</div>
                              <div className="flex gap-1.5 mt-0.5 text-[9px] text-zinc-450 font-mono">
                                <span>No. {p.number}</span>
                                <span>•</span>
                                <span className="uppercase text-amber-500 font-bold">{p.sport === "table_tennis" ? "TT" : p.sport}</span>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{parishTeam ? parishTeam.name : "Individual"}</span>
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20 text-zinc-400 font-mono uppercase font-black">{p.role}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CATEGORY 3: MATCH FIXTURES */}
                {searchResults.matches.length > 0 && (
                  <div className={`p-4 rounded-2xl border md:col-span-2 ${theme === "dark" ? "bg-black/60 border-zinc-850" : "bg-slate-50 border-slate-200"}`}>
                    <h3 className="text-[11px] font-mono font-bold tracking-wider text-amber-500 uppercase mb-3 flex items-center justify-between">
                      <span>🏆 Fixture & Matches ({searchResults.matches.length})</span>
                      <span className="text-[9px] text-zinc-500">Click card to open scoreboard view</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                      {searchResults.matches.map((m) => {
                        const tA = db.teams.find(t => t.id === m.teamAId);
                        const tB = db.teams.find(t => t.id === m.teamBId);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setActiveTab("dashboard");
                              setSelectedSport(m.sport);
                              setSearchQuery("");
                            }}
                            className={`p-3 border rounded-xl transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                              theme === "dark" ? "bg-zinc-950/80 border-zinc-900 hover:border-zinc-800" : "bg-white border-slate-200 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-mono text-amber-500 uppercase font-black bg-amber-500/10 border border-amber-500/20 px-1.5 rounded">{m.sport === "table_tennis" ? "TT" : m.sport}</span>
                              <span className={`text-[9.5px] font-sans font-black uppercase ${
                                m.status === "live" ? "text-red-500 animate-pulse" : "text-zinc-400"
                              }`}>{m.status}</span>
                            </div>
                            <div className="flex items-center justify-between my-2 font-sans">
                              <span className="text-xs font-black truncate max-w-[130px]">{tA ? tA.name : "TBD Team A"}</span>
                              {m.sport === "athletics" ? (
                                <span className="text-[10px] text-amber-500 font-mono font-bold">Track Race</span>
                              ) : (
                                <span className="font-mono text-xs font-black text-amber-500 px-2 py-0.5 border border-amber-500/15 bg-amber-500/5 rounded">
                                  {m.scoreA} : {m.scoreB}
                                </span>
                              )}
                              <span className="text-xs font-black truncate max-w-[130px]">{tB ? tB.name : "TBD Team B"}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-zinc-450 mt-1.5 font-mono pt-1.5 border-t border-zinc-900/30 dark:border-zinc-800/40">
                              <span>📅 {m.date} {m.time}</span>
                              <span className="font-bold">{m.stage}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CATEGORY 4: GALLERY HIGHLIGHT STORIES */}
                {searchResults.media.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/60 border-zinc-850" : "bg-slate-50 border-slate-200"}`}>
                    <h3 className="text-[11px] font-mono font-bold tracking-wider text-amber-500 uppercase mb-3 flex items-center justify-between">
                      <span>📹 Media Gallery ({searchResults.media.length})</span>
                      <span className="text-[9px] text-zinc-500">Event feed circulars</span>
                    </h3>
                    <div className="space-y-2">
                      {searchResults.media.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            setActiveTab("dashboard");
                            setSearchQuery("");
                          }}
                          className={`p-2.5 border rounded-xl transition-all cursor-pointer flex gap-3 items-center hover:scale-[1.01] ${
                            theme === "dark" ? "bg-zinc-950/80 border-zinc-900 hover:border-zinc-800" : "bg-white border-slate-200 hover:shadow-sm"
                          }`}
                        >
                          {post.mediaUrl ? (
                            <img src={post.mediaUrl} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-zinc-900/10 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-mono">🎬</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black truncate">{post.title}</h4>
                            <div className="flex gap-1.5 font-mono text-[9px] text-zinc-400 mt-0.5">
                              <span className="text-amber-500 font-bold uppercase">{post.mediaType}</span>
                              <span>•</span>
                              <span>❤️ {post.likes ? post.likes.length : 0} Likes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 5: BULLETIN NOTIFICATIONS */}
                {searchResults.alerts.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/60 border-zinc-850" : "bg-slate-50 border-slate-200"}`}>
                    <h3 className="text-[11px] font-mono font-bold tracking-wider text-amber-500 uppercase mb-3 flex items-center justify-between">
                      <span>📢 Broadcast Bulletins ({searchResults.alerts.length})</span>
                      <span className="text-[9px] text-zinc-500">Official circulars</span>
                    </h3>
                    <div className="space-y-2">
                      {searchResults.alerts.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setActiveTab("alerts");
                            setSearchQuery("");
                          }}
                          className={`p-2.5 border rounded-xl transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                            theme === "dark" ? "bg-zinc-950/80 border-zinc-900 hover:border-zinc-800" : "bg-white border-slate-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-extrabold truncate">{item.title}</span>
                            <span className="text-[8px] font-mono text-zinc-500">{item.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 leading-normal">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown Hero Widgets */}
      <main className="w-full max-w-7xl mx-auto px-4 flex-1">
        
        <Countdown theme={theme} />

        {/* Dynamic Sport and Category Filter Pills */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-none gap-4">
          <div className={`flex items-center gap-1.5 p-1.5 border rounded-2xl flex-shrink-0 ${
            theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-slate-100 border-slate-200 shadow-sm"
          }`}>
            {(db.games || ["football", "table_tennis", "volleyball", "athletics"]).map((sp) => (
              <button
                key={sp}
                onClick={() => {
                  setSelectedSport(sp);
                  setActiveTab("dashboard");
                }}
                className={`text-xs font-sans font-extrabold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedSport === sp && activeTab === "dashboard"
                    ? "bg-amber-500 text-black shadow-md scale-105 font-black"
                    : theme === "dark"
                      ? "text-zinc-300 hover:text-amber-400 hover:bg-white/5"
                      : "text-slate-700 hover:text-amber-800 hover:bg-black/5"
                }`}
              >
                {sp === "football" && "⚽ Football"}
                {sp === "table_tennis" && "🏓 Table Tennis"}
                {sp === "volleyball" && "🏐 Volleyball"}
                {sp === "athletics" && "🏃 Athletics"}
                {!["football", "table_tennis", "volleyball", "athletics"].includes(sp) && `🏆 ${sp.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`}
              </button>
            ))}
          </div>

          <div className={`text-xs font-mono font-medium ${theme === "dark" ? "text-zinc-500" : "text-slate-400"}`}>
            * August 9th Kickoff • Parish Standings Active
          </div>
        </div>

        {/* 3. PRIMARY PAGE RENDERING ROUTE SWITCHES */}
        {activeTab === "dashboard" && (
          <SportDashboard
            sport={selectedSport}
            teams={db.teams}
            players={db.players}
            matches={db.matches}
            awards={db.awards}
            theme={theme}
            onSelectVenue={(id) => { selectedVenueRef.current = id; }}
            onSetNavTab={setActiveTab}
            currentUser={currentUser}
            onLikePost={handleLikePost}
            mediaPosts={db.mediaPosts || []}
            onReactPost={handleReactPost}
            anonUserId={anonUserId}
          />
        )}

        {activeTab === "map" && (
          <ParishStandings 
            teams={db.teams}
            players={db.players}
            awards={db.awards}
            matches={db.matches}
            theme={theme}
          />
        )}

        {activeTab === "alerts" && (
          <div className="p-1 space-y-6">
            <div className={`flex items-center justify-between pb-3 mb-4 border-b ${theme === "dark" ? "border-zinc-850" : "border-slate-205 border-slate-200"}`}>
              <div>
                <h2 className={`text-lg font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-zinc-100" : "text-slate-900"}`}>
                  <Bell className="w-5 h-5 text-amber-500" /> Championships Alert Broadcaster
                </h2>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}>
                  Real-time simulated circular push notifications containing tournament announcements, weather conditions and ground updates.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowNotificationBellBadge(false);
                  const marked = db.notifications.map(n => ({ ...n, read: true }));
                  handleUpdateDbState({ ...db, notifications: marked, version: db.version + 1 });
                }}
                className={`text-xs font-semibold font-sans ${theme === "dark" ? "text-amber-500 hover:text-amber-450" : "text-amber-600 hover:text-amber-700"} hover:underline`}
              >
                Mark as all read
              </button>
            </div>

            {db.notifications.length === 0 ? (
              <div className={`p-12 text-center border rounded-2xl italic text-xs ${
                theme === "dark" ? "bg-zinc-900 border-zinc-850 text-zinc-500" : "bg-white border-slate-200 text-slate-400 shadow-sm"
              }`}>
                No circular alert announcements have been broadcasted yet. Check back during tournament start.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {db.notifications.map((notif) => {
                  let alertIconColor = theme === "dark" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-100";
                  if (notif.sport === "football") alertIconColor = theme === "dark" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-100";
                  else if (notif.sport === "volleyball") alertIconColor = theme === "dark" ? "bg-purple-500/15 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-100";
                  else if (notif.sport === "table_tennis") alertIconColor = theme === "dark" ? "bg-zinc-805 bg-gray-850 text-zinc-400 border-zinc-750" : "bg-slate-100 text-slate-500 border-slate-200";

                  return (
                    <div
                      key={notif.id}
                      className={`border p-4 rounded-xl shadow flex gap-4 items-start ${
                        theme === "dark" ? "bg-[#111827]/40 border-zinc-850/80 hover:border-zinc-800" : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm"
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg border flex-shrink-0 ${alertIconColor}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 leading-none mb-1.5">
                          <span className={`text-[9.5px] font-mono font-bold uppercase ${theme === "dark" ? "text-amber-500" : "text-amber-700"}`}>
                            📢 {notif.sport === "all" ? "Circular Alert" : `${notif.sport} Event`}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{notif.timestamp}</span>
                        </div>
                        <h4 className={`text-sm font-bold ${theme === "dark" ? "text-zinc-100" : "text-slate-900"}`}>{notif.title}</h4>
                        <p className={`text-xs leading-relaxed mt-1.5 font-sans ${theme === "dark" ? "text-zinc-400" : "text-slate-600"}`}>
                          {notif.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" && (
          <AdminPanel
            db={db}
            userRole={userRole}
            theme={theme}
            onUpdateRole={(role) => {
              setUserRole(role);
              localStorage.setItem("cassa_user_role", role);
            }}
            onUpdateDb={handleUpdateDbState}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* 3. PREMIUM PERSISTENT FOOTER */}
      <footer className={`w-full mt-auto border-t transition-colors duration-200 text-center ${
        theme === "dark" 
          ? "bg-[#030712] border-zinc-800/80 text-zinc-500" 
          : "bg-[#f8fafc] border-slate-200 text-slate-500"
      }`} style={{ paddingBottom: "110px", paddingTop: "32px", paddingLeft: "16px", paddingRight: "16px" }}>
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-amber-500" : "bg-amber-600"} animate-pulse`} />
            <p className="text-xs font-sans font-medium tracking-wide">
              Created by <span className={theme === "dark" ? "text-amber-400 font-bold" : "text-amber-700 font-bold"}>Thomas Adariku</span>, from St. Patrick's parish
            </p>
          </div>
          <p className="text-[10px] font-mono tracking-widest uppercase opacity-75">
            CALABAR ARCHDIOCESAN ALTAR SERVERS ASSOCIATION (CASSA) • © 2026
          </p>
          <p className="text-[8.5px] font-mono text-zinc-500 leading-normal max-w-sm mx-auto">
            This portal serves as the officially authorized real-time results, honors track and alert command center for CASSA Archdiocesan Olympic Games.
          </p>
        </div>
      </footer>

      {/* 4. OVERLAY MULTIPLAYER PUSH TOASTS ROW */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full font-sans">
        {toasts.map((notif) => (
          <div
            key={notif.toastId}
            className="pointer-events-auto bg-zinc-950 border border-amber-500/40 p-4 rounded-2xl shadow-xl flex gap-3.5 items-start justify-between relative overflow-hidden animate-slide-in"
            style={{
              boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)",
              animation: "slideIn 0.35s ease forwards"
            }}
          >
            {/* Slide animation helper */}
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>

            <div className="p-2.5 bg-amber-500 text-zinc-950 rounded-xl">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>

            <div className="flex-1">
              <span className="text-[8.5px] font-mono font-bold text-amber-500 uppercase tracking-widest leading-none">
                🔔 MULTIPLAYER NOTIFICATION ALERTS
              </span>
              <h5 className="text-xs font-black text-zinc-150 text-zinc-100 tracking-tight mt-1">
                {notif.title}
              </h5>
              <p className="text-[10.5px] text-zinc-450 text-zinc-400 mt-1 leading-snug">
                {notif.body}
              </p>
            </div>

            <button
              onClick={() => handleManualRemoveToast(notif.toastId)}
              className="text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-4 h-4 ml-2" />
            </button>
          </div>
        ))}
      </div>

      {/* 5. MODERN FLOATING BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 rounded-2xl px-5 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md max-w-lg w-[calc(100%-24px)] z-50">
        
        {/* Navigation Option 1: Dashboard */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1.5 transition-all outline-none ${
            activeTab === "dashboard" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold tracking-wider uppercase">Results</span>
        </button>

        {/* Navigation Option 2: Honor Roll */}
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1.5 transition-all outline-none ${
            activeTab === "map" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold tracking-wider uppercase">Honor Roll</span>
        </button>

        {/* Navigation Option 3: Alerts Feed */}
        <button
          onClick={() => {
            setActiveTab("alerts");
            setShowNotificationBellBadge(false);
          }}
          className={`flex flex-col items-center gap-1.5 transition-all outline-none relative ${
            activeTab === "alerts" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Bell className="w-5 h-5" />
          {showNotificationBellBadge && (
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full border border-zinc-900 absolute top-0.5 right-1 animate-pulse" />
          )}
          <span className="text-[9px] font-sans font-bold tracking-wider uppercase">Push Alerts</span>
        </button>

        {/* Navigation Option 4: Admin Center */}
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-1.5 transition-all outline-none ${
            activeTab === "admin" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold tracking-wider uppercase">Console</span>
        </button>

      </nav>

      {/* 6. SECURE OFFICIAL AUTHENTICATION MODAL */}
      {false && (
        <div id="auth-modal">
          <div>

            {/* Tabs Selector */}
            <div className={`grid grid-cols-2 p-1.5 rounded-xl border mb-5 font-mono text-xs ${
              theme === "dark" ? "bg-black/50 border-zinc-850" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                id="tab-sign-in"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                }}
                className={`py-1.5 rounded-lg font-bold transition-all uppercase cursor-pointer ${
                  authTab === "login"
                    ? "bg-amber-500 text-black shadow font-black"
                    : theme === "dark" ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-sign-up"
                onClick={() => {
                  setAuthTab("signup");
                  setAuthError("");
                }}
                className={`py-1.5 rounded-lg font-bold transition-all uppercase cursor-pointer ${
                  authTab === "signup"
                    ? "bg-amber-500 text-black shadow font-black"
                    : theme === "dark" ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Message Banners */}
            {authError && (
              <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-500 text-[11.5px] rounded-xl mb-4 font-sans font-bold flex items-center gap-1.5 animate-pulse">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11.5px] rounded-xl mb-4 font-sans font-bold flex items-center gap-1.5">
                <span>✔️</span>
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (authTab === "login") {
                  handleOfficialLogin(authEmail, authPassword);
                } else {
                  handleOfficialSignUp(authEmail, authUsername, authNickname, authPassword);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="e.g. fan@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 ${
                    theme === "dark" ? "bg-black/40 border-zinc-800 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                  }`}
                />
              </div>

              {authTab === "signup" && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Username (Fan Handle)
                  </label>
                  <input
                    id="auth-username-input"
                    type="text"
                    required
                    placeholder="e.g. gamergod or fan55"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 ${
                      theme === "dark" ? "bg-black/40 border-zinc-800 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>
              )}

              {authTab === "signup" && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Display Nickname
                  </label>
                  <input
                    id="auth-nickname-input"
                    type="text"
                    required
                    placeholder="e.g. Gamer God"
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 ${
                      theme === "dark" ? "bg-black/40 border-zinc-800 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Secure Password
                  </label>
                  {authTab === "login" && (
                    <button
                      id="auth-forgot-password"
                      type="button"
                      onClick={() => {
                        setAuthError("");
                        setAuthSuccess("");
                        setAuthError("Email recovery is not active yet. For testing, please use specialistgamergod@gmail.com with password 'specialist123' or register a new user.");
                      }}
                      className="text-[9.5px] font-mono font-bold text-amber-500 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 ${
                    theme === "dark" ? "bg-black/40 border-zinc-800 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                  }`}
                />
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black py-2.5 rounded-xl font-sans font-black text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {authTab === "login" ? "🔒 ACCESS ACCOUNT" : "✨ REGISTER FAN CARD"}
              </button>

              <p className="text-[10px] text-zinc-400 text-center leading-normal">
                {authTab === "login" 
                  ? "Don't have an official account? Switch to 'Sign Up' above to register instantly." 
                  : "By signing up, you register your email and global nickname across the Olympic arena."}
              </p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
