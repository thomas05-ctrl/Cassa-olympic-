import React, { useState } from "react";
import { TournamentDb, Match, Team, Player, SportType, Award, UserRole } from "../types";
import { getUnitLabels, UnitType } from "../utils/unitHelper";
import {
  Lock,
  Unlock,
  PlusCircle,
  Megaphone,
  Trash2,
  RefreshCw,
  Trophy,
  Activity,
  Users,
  Settings,
  Flame,
  Award as AwardIcon,
  Flag,
  UserPlus,
  Dribbble,
  Sparkles,
  Upload,
  Image,
  Pencil,
  Link,
  X
} from "lucide-react";

interface AdminPanelProps {
  db: TournamentDb;
  userRole: UserRole;
  theme?: string;
  onUpdateRole: (role: UserRole) => void;
  onUpdateDb: (newDb: TournamentDb) => void;
  onResetData: () => void;
}

export default function AdminPanel({
  db,
  userRole,
  theme,
  onUpdateRole,
  onUpdateDb,
  onResetData
}: AdminPanelProps) {
  const [passcode, setPasscode] = useState("");
  const [passMessage, setPassMessage] = useState({ text: "", type: "" });
  const unit = getUnitLabels(db.unitLabel);
  const [wrongCount, setWrongCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("cassa_admin_trials");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [lastStatus, setLastStatus] = useState<"none" | "wrong" | "correct">("none");
  const [activeTab, setActiveTab] = useState<
    "scores" | "matchmaker" | "parishes" | "members" | "games" | "awards" | "notifications" | "media"
  >("scores");

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "TBD";
    const team = db.teams.find((t) => t.id === teamId);
    return team ? team.name : "TBD";
  };

  const gamesList = db.games || ["football", "table_tennis", "volleyball", "athletics"];

  // State for adding a match
  const [newMatch, setNewMatch] = useState({
    sport: gamesList[0] || "football",
    stage: "Group Stage",
    teamAId: "",
    teamBId: "",
    date: "Aug 9, 2026",
    time: "12:00",
    status: "upcoming" as "upcoming" | "live" | "finished",
    venue: "St. Patrick's Main Arena"
  });

  // State for adding a sport game
  const [newSportName, setNewSportName] = useState("");

  // State for adding a parish / team
  const [parishForm, setParishForm] = useState({
    name: "",
    logoColor: "bg-emerald-500",
    logoUrl: "",
    sport: gamesList[0] || "football"
  });

  const [editingParish, setEditingParish] = useState<Team | null>(null);
  const [editParishForm, setEditParishForm] = useState<{
    id: string;
    name: string;
    logoColor: string;
    logoUrl: string;
  }>({ id: "", name: "", logoColor: "", logoUrl: "" });

  // State for adding a roster member / player
  const [memberForm, setMemberForm] = useState({
    name: "",
    teamId: "",
    sport: gamesList[0] || "football",
    number: "7",
    role: "Striker"
  });

  // State for sending custom push notifications
  const [notifForm, setNotifForm] = useState({
    title: "",
    body: "",
    sport: "all" as SportType | "all"
  });

  // State for awarding medal
  const [awardForm, setAwardForm] = useState({
    name: "Golden Ball Award",
    sport: "football" as SportType,
    category: "individual" as "team" | "individual",
    recipientName: "",
    teamName: "",
    details: ""
  });

  // State for posting media item
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  const [mediaCategory, setMediaCategory] = useState<"live" | "recent" | "upcoming">("recent");
  const [mediaMatchId, setMediaMatchId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFileChange = (file: File) => {
    setFileError("");
    if (file.size > 25 * 1024 * 1024) {
      setFileError("File sizes larger than 25MB are not recommended for direct base64 database encoding.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
    };
    reader.onerror = () => {
      setFileError("Failed to read binary stream.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handlePostMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) return;
    if (!mediaUrl.trim()) {
      setFileError("A valid image/reels/sound URL or local uploaded binary file is required.");
      return;
    }

    const newPost = {
      id: `post-${Date.now()}`,
      title: mediaTitle,
      mediaType: mediaType,
      url: mediaUrl,
      likes: [],
      reactions: {
        "👍": [],
        "🔥": [],
        "😅": [],
        "👏": [],
        "😭": [],
        "😕": []
      },
      category: mediaCategory,
      matchId: mediaMatchId || undefined,
      author: "CASSA Administrator Office",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString()
    };

    const updatedPosts = [newPost, ...(db.mediaPosts || [])];
    onUpdateDb({
      ...db,
      mediaPosts: updatedPosts,
      version: db.version + 1
    });

    // Reset Form fields
    setMediaTitle("");
    setMediaType("image");
    setMediaCategory("recent");
    setMediaMatchId("");
    setMediaUrl("");
    setPassMessage({ text: "Media story published successfully into live database!", type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 4000);
  };

  const handleDeletePost = (postId: string) => {
    const updated = (db.mediaPosts || []).filter((p) => p.id !== postId);
    onUpdateDb({
      ...db,
      mediaPosts: updated,
      version: db.version + 1
    });
    setPassMessage({ text: "Media post pruned successfully.", type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  // Handle Passcode Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (wrongCount >= 7) {
      setLastStatus("wrong");
      setPassMessage({
        text: "🚨 SECURITY BREACH FLAGGED: DEVICE CODES TERMINATED. HARDWARE ACCESS REJECTED.",
        type: "error"
      });
      return;
    }

    if (passcode === "Qwerty1234") {
      setLastStatus("correct");
      onUpdateRole("admin");
      setWrongCount(0);
      try {
        localStorage.setItem("cassa_admin_trials", "0");
      } catch (err) {}
      setPassMessage({ text: "Full Oracle-level Administrator terminal unlocked!", type: "success" });
      setPasscode("");
    } else {
      setLastStatus("wrong");
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      try {
        localStorage.setItem("cassa_admin_trials", String(nextWrong));
      } catch (err) {}
      
      let threat = "";
      if (nextWrong <= 4) {
        threat = `⚠️ WARNING: Invalid credential input. Trial ${nextWrong}/7. Failing ${7 - nextWrong} more times will lock down this browser socket permanently.`;
      } else if (nextWrong === 5) {
        threat = "☠️ SYSTEM ALERT: Unauthorized admin access pattern recorded. Trial 5/7. Section 4b Altar Server Protocol is primed. Two attempts remaining!";
      } else if (nextWrong === 6) {
        threat = "🚨 CRITICAL VIOLATION IN PROGRESS: Trial 6/7. FINAL CHANCE! One more wrong passcode and your hardware GUID and device network IP will be permanently excluded from the portal.";
      } else {
        threat = "🚫 ACCESS PREVENTED: HARDWARE LOCKOUT ACTIVE. Intrusion log has been transmitted to Archdiocesan Liturgical High Commission.";
      }
      setPassMessage({ text: threat, type: "error" });
    }
  };

  // 1. Update Match score / status on client server database
  const handleUpdateMatchScore = async (matchId: string, teamAOffset: number, teamBOffset: number) => {
    const updatedMatches = db.matches.map((m) => {
      if (m.id === matchId) {
        const scoreA = Math.max(0, (m.scoreA || 0) + teamAOffset);
        const scoreB = Math.max(0, (m.scoreB || 0) + teamBOffset);
        return { ...m, scoreA, scoreB };
      }
      return m;
    });

    const newDb = { ...db, matches: updatedMatches, version: db.version + 1 };
    onUpdateDb(newDb);
  };

  // 2. Modify Match state (Status toggler)
  const handleToggleMatchStatus = async (matchId: string, nextStatus: "upcoming" | "live" | "finished") => {
    const updatedMatches = db.matches.map((m) => {
      if (m.id === matchId) {
        let livePeriod = m.livePeriod;
        let liveTime = m.liveTime;
        
        if (nextStatus === "live") {
          livePeriod = m.sport === "football" ? "1st Half" : "Set 1";
          liveTime = m.sport === "football" ? "00:00" : "Point: 0-0";
        } else if (nextStatus === "finished") {
          livePeriod = m.sport === "football" ? "Full Time" : "Finished";
          liveTime = m.sport === "football" ? "90:00" : "Sets final";
        }

        return { 
          ...m, 
          status: nextStatus,
          scoreA: m.scoreA === undefined ? 0 : m.scoreA,
          scoreB: m.scoreB === undefined ? 0 : m.scoreB,
          livePeriod,
          liveTime
        };
      }
      return m;
    });

    const newDb = { ...db, matches: updatedMatches, version: db.version + 1 };
    onUpdateDb(newDb);
  };

  // 3. Create Matchmaker Fixture
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === "spectator") return;

    const newFixture: Match = {
      id: `match-custom-${Date.now()}`,
      sport: newMatch.sport,
      stage: newMatch.stage,
      teamAId: newMatch.teamAId || undefined,
      teamBId: newMatch.teamBId || undefined,
      scoreA: newMatch.status !== "upcoming" ? 0 : undefined,
      scoreB: newMatch.status !== "upcoming" ? 0 : undefined,
      date: newMatch.date,
      time: newMatch.time,
      status: newMatch.status,
      venue: newMatch.venue,
      livePeriod: newMatch.status === "live" ? "1st Half" : undefined,
      liveTime: newMatch.status === "live" ? "00:00" : undefined,
      liveScoreLogs: []
    };

    // If athletics, create basic starting runners
    if (newMatch.sport === "athletics") {
      newFixture.runners = db.players
        .filter((p) => p.sport === "athletics")
        .map((p, idx) => ({
          playerId: p.id,
          playerName: p.name,
          teamName: p.teamId !== "individual" ? (db.teams.find(t => t.id === p.teamId)?.name || "AC") : "Swift Striders",
          lane: idx + 1,
          reactionTime: 0
        }));
    }

    const newDb = {
      ...db,
      matches: [newFixture, ...db.matches],
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setNewMatch({ ...newMatch, teamAId: "", teamBId: "" });
    setPassMessage({ text: "Tournament fixture successfully appended to active pipeline!", type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  // 4. Send circular notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.body) return;

    try {
      const resp = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifForm)
      });
      const data = await resp.json();
      if (data.success) {
        onUpdateDb(data.db);
        setNotifForm({ title: "", body: "", sport: "all" });
        setPassMessage({ text: "Circular Push Notification broadcasted to all synchronized spectators!", type: "success" });
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  // 5. Award Medal
  const handleAwardMedal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardForm.recipientName) return;

    const newAward: Award = {
      id: `aw-custom-${Date.now()}`,
      sport: awardForm.sport,
      name: awardForm.name,
      category: awardForm.category,
      recipientName: awardForm.recipientName,
      teamName: awardForm.teamName || undefined,
      details: awardForm.details || undefined
    };

    const newDb = {
      ...db,
      awards: [newAward, ...db.awards],
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setAwardForm({ ...awardForm, recipientName: "", teamName: "", details: "" });
    setPassMessage({ text: "Championship medal conferred to player roster!", type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  // 6. Delete match
  const handleDeleteMatch = (matchId: string) => {
    const freshMatches = db.matches.filter((m) => m.id !== matchId);
    const newDb = { ...db, matches: freshMatches, version: db.version + 1 };
    onUpdateDb(newDb);
  };

  // 7. Custom additions (Parishes, Members, Games)
  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim()) return;

    const formattedSport = newSportName.trim().toLowerCase().replace(/\s+/g, "_");
    
    // Check if game already exists
    if (gamesList.includes(formattedSport)) {
      setPassMessage({ text: "Sport category already exists!", type: "error" });
      return;
    }

    const updatedGames = [...gamesList, formattedSport];
    const newDb = {
      ...db,
      games: updatedGames,
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setNewSportName("");
    setPassMessage({ text: `Dynamic Game category '${newSportName}' added! It instantly creates top filter pills.`, type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const handleParishLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditParishForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      } else {
        setParishForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddParish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parishForm.name.trim()) return;

    const newTeam: Team = {
      id: `team-parish-${Date.now()}`,
      name: parishForm.name.trim(),
      logoColor: parishForm.logoColor,
      logoUrl: parishForm.logoUrl.trim() || undefined,
      sport: "all",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      stats: { gd: 0 }
    };

    const newDb = {
      ...db,
      teams: [...db.teams, newTeam],
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setParishForm({ ...parishForm, name: "", logoUrl: "" });
    setPassMessage({ text: `Parish '${newTeam.name}' successfully enrolled for all sports competitions!`, type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const handleSaveEditParish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParishForm.name.trim() || !editParishForm.id) return;

    const updatedTeams = db.teams.map((t) => {
      if (t.id === editParishForm.id) {
        return {
          ...t,
          name: editParishForm.name.trim(),
          logoColor: editParishForm.logoColor,
          logoUrl: editParishForm.logoUrl.trim() || undefined
        };
      }
      return t;
    });

    const newDb = {
      ...db,
      teams: updatedTeams,
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setEditingParish(null);
    setPassMessage({ text: `Parish '${editParishForm.name}' updated successfully!`, type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const handleRemoveParish = (teamId: string) => {
    const updatedTeams = db.teams.filter((t) => t.id !== teamId);
    const newDb = {
      ...db,
      teams: updatedTeams,
      version: db.version + 1
    };
    onUpdateDb(newDb);
    setPassMessage({ text: "Parish competitor successfully removed from CASSA tournament!", type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const handleToggleParishSuspension = (teamId: string) => {
    const updatedTeams = db.teams.map((t) => {
      if (t.id === teamId) {
        return { ...t, isSuspended: !t.isSuspended };
      }
      return t;
    });
    const newDb = {
      ...db,
      teams: updatedTeams,
      version: db.version + 1
    };
    onUpdateDb(newDb);
    const team = db.teams.find((t) => t.id === teamId);
    const wasSuspended = team?.isSuspended;
    setPassMessage({ text: `Parish is now ${wasSuspended ? "Reinstated" : "Suspended"}!`, type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;

    const newPlayer: Player = {
      id: `memb-player-${Date.now()}`,
      name: memberForm.name.trim(),
      teamId: memberForm.teamId || "individual",
      sport: memberForm.sport,
      number: parseInt(memberForm.number) || 10,
      role: memberForm.role,
      stats: memberForm.sport === "football" 
        ? { goals: 0, assists: 0 } 
        : memberForm.sport === "volleyball" 
          ? { blocks: 0, aces: 0 } 
          : memberForm.sport === "table_tennis" 
            ? { setsWon: 0 } 
            : { bestTimeSeconds: 12.4 }
    };

    const newDb = {
      ...db,
      players: [newPlayer, ...db.players],
      version: db.version + 1
    };

    onUpdateDb(newDb);
    setMemberForm({ ...memberForm, name: "" });
    setPassMessage({ text: `Member athlete '${newPlayer.name}' added to roster lineup!`, type: "success" });
    setTimeout(() => setPassMessage({ text: "", type: "" }), 3000);
  };

  const getFilteredTeamsForSport = (sport: SportType) => {
    return db.teams.filter((t) => t.sport === "all" || t.sport === sport || !t.sport);
  };

  return (
    <div className={`w-full border rounded-2xl p-5 mb-16 shadow-xl relative overflow-hidden backdrop-blur-md transition-colors duration-200 ${
      theme === "dark" ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-slate-205 border-slate-200 text-slate-800 shadow-md"
    }`}>
      
      {/* Background decoration */}
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Admin Title Info */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6 ${
        theme === "dark" ? "border-white/10" : "border-slate-200"
      }`}>
        <div>
          <span className={`text-[10px] font-mono font-extrabold tracking-widest uppercase ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>Admin Console Terminal</span>
          <h2 className={`text-xl font-sans font-black mt-0.5 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            CASSA Olympic Organizer Panel
          </h2>
          <p className={`text-xs font-sans mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
            Manage dynamic organization units, roster members, fixtures, sports categories, and circular push indicators.
          </p>
        </div>

        {/* Security Role Monitor & Lock Status */}
        <div className={`p-2 flex items-center gap-3 rounded-xl border ${
          theme === "dark" ? "bg-black/40 border-white/10" : "bg-slate-100 border-slate-200"
        }`}>
          <div className="text-left px-1.5">
            <div className="text-[8px] font-mono text-gray-400 uppercase leading-none font-bold">Access status</div>
            <div className={`text-xs font-extrabold capitalize mt-1 leading-none ${
              userRole === "spectator" 
                ? "text-zinc-400" 
                : userRole === "coordinator" 
                  ? "text-amber-505 text-amber-500" 
                  : "text-red-500"
            }`}>
              {userRole === "spectator" ? "Spectator (Locked)" : `${userRole} Session`}
            </div>
          </div>
          {userRole !== "spectator" && (
            <button
              onClick={() => {
                onUpdateRole("spectator");
                setPassMessage({ text: "Security reset: Console locked successfully.", type: "success" });
                setTimeout(() => setPassMessage({ text: "", type: "" }), 3500);
              }}
              className="text-[9.5px] font-sans font-black bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              🔒 Securitize / Lock
            </button>
          )}
        </div>
      </div>

      {passMessage.text && (
        <div className={`p-4 rounded-xl border mb-6 text-xs font-sans font-bold text-center ${
          passMessage.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            : "bg-red-500/10 border-red-500/20 text-red-500"
        }`}>
          {passMessage.text}
        </div>
      )}

      {/* ACCESS BLOCK: IF ROLE IS VIEW-ONLY SPECTATOR */}
      {userRole === "spectator" ? (
        <div className="py-12 flex flex-col items-center justify-center max-w-md mx-auto text-center">
          {wrongCount >= 7 ? (
            <div className="p-6 bg-red-950/20 border-2 border-red-500 rounded-3xl mb-4 w-full animate-pulse">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-black text-red-500 uppercase tracking-wider">HARDWARE LOCKED OUT</h3>
              <p className="text-xs text-red-300 leading-relaxed mt-2">
                This client socket has exceeded the maximum auth threshold of 7 trial attempts. 
                All Admin Console terminal signals have been permanently disabled, and telemetry 
                coordinates have been transmitted to the Archdiocesan Vicar for Server Discipline.
              </p>
              <div className="mt-4 p-2.5 bg-black/50 text-[10px] font-mono text-red-400 rounded-xl border border-red-500/30">
                CLIENT GUID: TERM-LOCKED-SEC-4B<br/>
                IP: COORD_BLOCKED_RESOLVE_FALSE
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-4">
                <Lock className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className={`text-base font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Terminal Access Restricted</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-2.5">
                To prevent accidental alteration or data drift, modifying match results, sending circular alerts, and configuring parishes requires unlocking.
              </p>

              {/* Passcode Unlock Form */}
              <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3 mt-6">
                <input
                  type="password"
                  placeholder="Enter terminal passcode..."
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (lastStatus === "wrong") setLastStatus("none");
                  }}
                  className={`border rounded-xl px-3.5 py-3 text-xs focus:outline-none transition-all w-full text-center tracking-widest ${
                    lastStatus === "wrong"
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-500/5 focus:border-red-500"
                      : lastStatus === "correct"
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5 focus:border-emerald-500"
                        : theme === "dark"
                          ? "bg-black/40 border-zinc-800 text-white focus:border-amber-500"
                          : "bg-slate-50 border-slate-205 text-slate-800 focus:border-amber-500"
                  }`}
                />
                
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3 font-sans font-black uppercase text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Unlock className="w-4 h-4" /> Unlock Console
                </button>

                <div className="text-[10px] font-mono text-gray-400 mt-1">
                  Active Security System: {7 - wrongCount} trials remaining before permanent device block.
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        /* GRANTED PRIVILEGED ACCESS BOARD */
        <div>
          <div className={`p-1 flex rounded-xl mb-6 overflow-x-auto gap-0.5 border ${
            theme === "dark" ? "bg-black/40 border-white/10" : "bg-slate-100 border-slate-200"
          }`}>
            {(
              [
                { id: "scores", label: "Score Keeper", roleRequired: "coordinator" },
                { id: "media", label: "Media Hub Manager", roleRequired: "admin" },
                { id: "matchmaker", label: "Add Match", roleRequired: "admin" },
                { id: "parishes", label: "Add Parish", roleRequired: "admin" },
                { id: "members", label: "Add Members", roleRequired: "admin" },
                { id: "games", label: "Add Game Category", roleRequired: "admin" },
                { id: "awards", label: "Assign Awards", roleRequired: "admin" },
                { id: "notifications", label: "circular broadcast", roleRequired: "admin" }
              ] as const
            ).map((tab) => {
              const isAllowed = userRole === "admin" || tab.roleRequired === "coordinator";
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  disabled={!isAllowed}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[10px] font-mono font-bold leading-none py-2 px-3 rounded-lg transition-all capitalize flex-shrink-0 flex items-center gap-1 ${
                    isActive
                      ? theme === "dark"
                        ? "bg-blue-600/30 text-blue-400 border border-blue-500/20"
                        : "bg-white text-blue-600 shadow-sm border border-slate-205"
                      : theme === "dark"
                        ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                        : "text-slate-650 hover:text-slate-900 hover:bg-black/5"
                  } ${!isAllowed ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {tab.label}
                  {!isAllowed && "🔒"}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT 1: SCORE KEEPER (COORDINATOR+) */}
          {activeTab === "scores" && (
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Activity className="w-4 h-4 text-emerald-500" /> Active Scores & Match Status Keepers
                </h3>
                <p className="text-xs text-gray-400">Modify active match points and toggle statuses from Group fixtures up to Finals.</p>
              </div>

              {db.matches.length === 0 ? (
                <div className="py-12 text-center text-xs italic text-gray-500 bg-black/20 rounded-xl border border-white/5">
                  No matches have been added or matches were cleared. Add a match in the 'Add Match' tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {db.matches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-3.5 rounded-xl border relative font-sans flex flex-col justify-between ${
                        theme === "dark" ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold">
                          {match.sport} - {match.stage}
                        </span>

                        {/* Status label toggler switches */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleMatchStatus(match.id, "upcoming")}
                            className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              match.status === "upcoming"
                                ? "bg-zinc-700 border-zinc-650 text-white font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            UPCOMING
                          </button>
                          <button
                            onClick={() => handleToggleMatchStatus(match.id, "live")}
                            className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              match.status === "live"
                                ? "bg-red-650 bg-red-600 border-red-500 text-white font-extrabold animate-pulse"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            LIVE
                          </button>
                          <button
                            onClick={() => handleToggleMatchStatus(match.id, "finished")}
                            className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              match.status === "finished"
                                ? "bg-emerald-600 border-emerald-500 text-white font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            FINISHED
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-y border-white/5 my-2">
                        {/* Team A */}
                        <div className="flex-1 max-w-[40%] text-left">
                          <p className="text-xs font-bold truncate">{getTeamName(match.teamAId)}</p>
                          {match.status !== "upcoming" && (
                            <div className="flex gap-1 mt-1.5">
                              <button
                                onClick={() => handleUpdateMatchScore(match.id, -1, 0)}
                                className="bg-black/40 border border-white/10 w-6 h-6 rounded flex items-center justify-center font-mono text-xs hover:bg-black/60 cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleUpdateMatchScore(match.id, 1, 0)}
                                className="bg-blue-600 w-6 h-6 rounded flex items-center justify-center font-mono text-xs text-white hover:bg-blue-500 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Scores */}
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-lg font-mono font-black border px-3 py-1 rounded leading-none ${
                            theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
                          }`}>
                            {match.scoreA !== undefined ? match.scoreA : "-"} : {match.scoreB !== undefined ? match.scoreB : "-"}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className="flex-1 max-w-[40%] text-right">
                          <p className="text-xs font-bold truncate">{getTeamName(match.teamBId)}</p>
                          {match.status !== "upcoming" && (
                            <div className="flex gap-1 mt-1.5 justify-end">
                              <button
                                onClick={() => handleUpdateMatchScore(match.id, 0, -1)}
                                className="bg-black/40 border border-white/10 w-6 h-6 rounded flex items-center justify-center font-mono text-xs hover:bg-black/60 cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleUpdateMatchScore(match.id, 0, 1)}
                                className="bg-blue-600 w-6 h-6 rounded flex items-center justify-center font-mono text-xs text-white hover:bg-blue-500 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>📍 {match.venue}</span>
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="text-red-500 hover:text-red-400 font-mono text-[9px] uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Match
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: ADD MATCH FIXTURE (ADMIN) */}
          {activeTab === "matchmaker" && (
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="border-b border-white/5 pb-2 flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    <PlusCircle className="w-4 h-4 text-blue-500" /> Matchmaker Fixture Seeder
                  </h3>
                  <p className="text-xs text-gray-400">Initialize a custom group stage clash or a bracket final on the server database.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">CHOOSE SPORT CATEGORY</label>
                  <select
                    value={newMatch.sport}
                    onChange={(e) => {
                      const selectedSport = e.target.value;
                      // Auto populate first team options if possible
                      const matchOptionTeams = getFilteredTeamsForSport(selectedSport);
                      setNewMatch({
                        ...newMatch,
                        sport: selectedSport,
                        teamAId: matchOptionTeams[0]?.id || "",
                        teamBId: matchOptionTeams[1]?.id || ""
                      });
                    }}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    {gamesList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">MATCHING STAGE STAMP</label>
                  <input
                    type="text"
                    value={newMatch.stage}
                    onChange={(e) => setNewMatch({ ...newMatch, stage: e.target.value })}
                    placeholder="Group Stage A, Semi-final 1, Final..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">ST. PATRICK'S ARENA CHOSEN</label>
                  <input
                    type="text"
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                    placeholder="St. Patrick's Main Field, Youth Hall..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              {newMatch.sport !== "athletics" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">HOME TEAM (PARISH OR CLUB)</label>
                    <select
                      value={newMatch.teamAId}
                      onChange={(e) => setNewMatch({ ...newMatch, teamAId: e.target.value })}
                      className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    >
                      <option value="">-- Choose Home Parish --</option>
                      {getFilteredTeamsForSport(newMatch.sport).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">AWAY TEAM (PARISH OR CLUB)</label>
                    <select
                      value={newMatch.teamBId}
                      onChange={(e) => setNewMatch({ ...newMatch, teamBId: e.target.value })}
                      className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    >
                      <option value="">-- Choose Away Parish --</option>
                      {getFilteredTeamsForSport(newMatch.sport).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">DATE OF CLASH</label>
                  <input
                    type="text"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    placeholder="Aug 9, 2026..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">START TIME</label>
                  <input
                    type="text"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    placeholder="14:30..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">INITIAL STATUS</label>
                  <select
                    value={newMatch.status}
                    onChange={(e) => setNewMatch({ ...newMatch, status: e.target.value as any })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live Now</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-500 text-xs font-sans font-bold py-2.5 px-5 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Confirm & Seed Match Fixture
                </button>
              </div>
            </form>
          )}

          {/* TAB CONTENT 3: ADD PARISH/DEANERY (ADMIN) */}
          {activeTab === "parishes" && (
            <div className="space-y-6">
              {/* ORGANIZATION CLASSIFICATION LEVEL SWITCHER */}
              <div className={`p-4 rounded-2xl border ${
                theme === "dark" ? "bg-black/40 border-amber-500/20" : "bg-amber-50/60 border-amber-200"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-extrabold block">
                      ORGANIZATION CLASSIFICATION LEVEL
                    </span>
                    <h4 className={`text-xs font-sans font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      Set Dynamic Terminology (Parish, Deanery, Club, Zone)
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Currently set to <span className="text-amber-400 font-bold font-mono">{unit.singular}</span>. All standings, scoreboards, and rosters will adapt automatically.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-amber-500/30">
                    {(["parish", "deanery", "club", "zone"] as const).map((type) => {
                      const isSelected = (db.unitLabel || "parish") === type;
                      const labels = getUnitLabels(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const newDb = { ...db, unitLabel: type, version: (db.version || 0) + 1 };
                            onUpdateDb(newDb);
                            setPassMessage({
                              text: `Classification level switched to '${labels.singular}'! Saved to database.`,
                              type: "success"
                            });
                            setTimeout(() => setPassMessage({ text: "", type: "" }), 3500);
                          }}
                          className={`text-[10px] font-mono uppercase font-black py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-amber-500 text-black shadow-md font-extrabold"
                              : "text-gray-300 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span>{labels.icon}</span>
                          <span>{labels.singular}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddParish} className="space-y-4">
                <div className="border-b border-amber-500/10 pb-2">
                  <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-amber-400" : "text-amber-805"}`}>
                    <Flag className="w-4 h-4 text-amber-500" /> Enroll New Competing {unit.singular}
                  </h3>
                  <p className="text-xs text-gray-400">Register local {unit.pluralLower} competing in the current CASSA OLYMPIC cycle with official crests & logos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1 font-bold">{unit.singular.toUpperCase()} NAME</label>
                    <input
                      type="text"
                      required
                      value={parishForm.name}
                      onChange={(e) => setParishForm({ ...parishForm, name: e.target.value })}
                      placeholder={`e.g. ${unit.singular === "Deanery" ? "Calabar Central Deanery" : "St. Patrick's Cathedral Parish"}...`}
                      className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1 font-bold">BRAND COLOR ACCENT</label>
                    <select
                      value={parishForm.logoColor}
                      onChange={(e) => setParishForm({ ...parishForm, logoColor: e.target.value })}
                      className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    >
                      <option value="bg-emerald-500 text-white">Emerald Green</option>
                      <option value="bg-sky-500 text-white">Sky Blue</option>
                      <option value="bg-amber-500 text-slate-900">Amber Gold</option>
                      <option value="bg-purple-500 text-white">Royal Purple</option>
                      <option value="bg-red-500 text-white">Crimson Red</option>
                      <option value="bg-orange-500 text-white">Vibrant Orange</option>
                      <option value="bg-pink-500 text-white">Neon Pink</option>
                      <option value="bg-indigo-600 text-white">Midnight Indigo</option>
                    </select>
                  </div>
                </div>

                {/* PARISH CREST / LOGO INPUT AND UPLOAD */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-amber-400 block font-bold flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" /> PARISH LOGO / CREST (IMAGE UPLOAD OR URL)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="relative flex-1 w-full">
                      <input
                        type="url"
                        value={parishForm.logoUrl}
                        onChange={(e) => setParishForm({ ...parishForm, logoUrl: e.target.value })}
                        placeholder="Paste image web link (https://...) or upload file below"
                        className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                          theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                        }`}
                      />
                    </div>

                    <label className="cursor-pointer inline-flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold active:scale-95 transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Logo Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleParishLogoFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* LOGO LIVE PREVIEW BOX */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-mono text-gray-400">Preview:</span>
                    {parishForm.logoUrl ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 bg-black flex items-center justify-center">
                          <img src={parishForm.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setParishForm({ ...parishForm, logoUrl: "" })}
                          className="text-[10px] font-mono text-red-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`w-6 h-6 rounded-full border border-black/20 ${parishForm.logoColor}`} />
                        <span className="text-[10px] italic">Color badge fallback (no image set)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 text-black hover:bg-amber-400 text-xs font-sans font-black uppercase tracking-wider py-2.5 px-6 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Enroll Parish Team
                  </button>
                </div>
              </form>

              {/* EDIT PARISH MODAL / CARD */}
              {editingParish && (
                <div className="p-4 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 backdrop-blur-md space-y-4 my-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                    <h4 className="text-xs font-sans font-black text-amber-400 uppercase flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit Parish Logo & Information
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingParish(null)}
                      className="text-gray-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditParish} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-gray-400 block mb-1 font-bold">PARISH NAME</label>
                        <input
                          type="text"
                          required
                          value={editParishForm.name}
                          onChange={(e) => setEditParishForm({ ...editParishForm, name: e.target.value })}
                          className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                            theme === "dark" ? "bg-black/60 border-white/10 text-white" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-gray-400 block mb-1 font-bold">BRAND COLOR ACCENT</label>
                        <select
                          value={editParishForm.logoColor}
                          onChange={(e) => setEditParishForm({ ...editParishForm, logoColor: e.target.value })}
                          className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                            theme === "dark" ? "bg-black/60 border-white/10 text-white" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        >
                          <option value="bg-emerald-500 text-white">Emerald Green</option>
                          <option value="bg-sky-500 text-white">Sky Blue</option>
                          <option value="bg-amber-500 text-slate-900">Amber Gold</option>
                          <option value="bg-purple-500 text-white">Royal Purple</option>
                          <option value="bg-red-500 text-white">Crimson Red</option>
                          <option value="bg-orange-500 text-white">Vibrant Orange</option>
                          <option value="bg-pink-500 text-white">Neon Pink</option>
                          <option value="bg-indigo-600 text-white">Midnight Indigo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-amber-400 block mb-1 font-bold">LOGO / CREST IMAGE URL OR FILE</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editParishForm.logoUrl}
                          onChange={(e) => setEditParishForm({ ...editParishForm, logoUrl: e.target.value })}
                          placeholder="Image Web URL (https://...)"
                          className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-amber-500 flex-1 ${
                            theme === "dark" ? "bg-black/60 border-white/10 text-white" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        />
                        <label className="cursor-pointer inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-mono font-bold active:scale-95 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleParishLogoFileUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">Current Logo:</span>
                        {editParishForm.logoUrl ? (
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-500 bg-black">
                            <img src={editParishForm.logoUrl} alt="Edit preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className={`w-5 h-5 rounded-full ${editParishForm.logoColor}`} />
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingParish(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white border border-transparent hover:border-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl text-xs font-sans font-black bg-amber-500 text-black hover:bg-amber-400 shadow"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* LIST OF REGISTERED COMPETITOR PARISHES */}
              <div className="mt-8 border-t border-amber-500/15 pt-6">
                <div className="mb-4 flex justify-between items-center">
                  <h4 className={`text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${theme === "dark" ? "text-amber-400" : "text-amber-800"}`}>
                    🏰 Registered Parishes & Competitors ({db.teams.length})
                  </h4>
                  <span className="text-[9.5px] font-mono text-gray-400 font-bold uppercase hidden sm:inline">Actions located on the right</span>
                </div>

                {db.teams.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border border-dashed italic text-xs ${
                    theme === "dark" ? "bg-black/30 border-white/10 text-gray-500" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    No parish clubs are registered yet. Register above.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {db.teams.map((team) => (
                      <div
                        key={team.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          team.isSuspended
                            ? theme === "dark"
                              ? "bg-zinc-950/40 border-red-500/20 opacity-60"
                              : "bg-red-50/40 border-red-200 opacity-60"
                            : theme === "dark"
                              ? "bg-black/40 border-zinc-900 hover:border-amber-500/30"
                              : "bg-slate-50 border-slate-205 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 max-w-[55%]">
                          {team.logoUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 shrink-0 bg-black flex items-center justify-center shadow-sm">
                              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <span className={`w-4 h-4 rounded-full border border-black/10 shrink-0 ${team.logoColor}`} />
                          )}
                          <div className="truncate">
                            <span className={`text-sm font-sans font-black block truncate ${theme === "dark" ? "text-white" : "text-slate-905"}`}>
                              {team.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-500 block">
                              CLASSIFICATION: {team.sport === "all" ? "All Sports Tournaments" : team.sport}
                            </span>
                          </div>
                        </div>

                        {/* Actions on the right hand side */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingParish(team);
                              setEditParishForm({
                                id: team.id,
                                name: team.name,
                                logoColor: team.logoColor || "bg-emerald-500",
                                logoUrl: team.logoUrl || ""
                              });
                            }}
                            className="text-amber-400 border border-amber-500/20 p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                            title="Edit Parish Logo & Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleParishSuspension(team.id)}
                            className={`text-[9.5px] font-mono font-black py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                              team.isSuspended
                                ? "bg-emerald-600/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black"
                                : "bg-red-600/10 border-red-300 text-red-500 hover:bg-red-500 hover:text-white"
                            }`}
                          >
                            {team.isSuspended ? "Reinstate" : "Suspend"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveParish(team.id)}
                            className="text-red-500 border border-red-500/20 p-2 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                            title="Remove Parish From Roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: ADD MEMBERS (ADMIN) */}
          {activeTab === "members" && (
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <UserPlus className="w-4 h-4 text-blue-500" /> Enlist Member Athlete onto Roster
                </h3>
                <p className="text-xs text-gray-400">Add an active athlete participant, assign a vest shirt number, position role, and parish unit.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">ATHLETE / MEMBER NAME</label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="e.g. John Bosco Effiong..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">SELECT MEMBER SPORT</label>
                  <select
                    value={memberForm.sport}
                    onChange={(e) => setMemberForm({ ...memberForm, sport: e.target.value })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    {gamesList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">PARISH AFFILIATION UNIT</label>
                  <select
                    value={memberForm.teamId}
                    onChange={(e) => setMemberForm({ ...memberForm, teamId: e.target.value })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    <option value="">-- Choose Parish --</option>
                    <option value="individual">Individual Entry / Freelancer</option>
                    {db.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.sport === "all" ? "All Sports" : t.sport})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">VEST / JERSEY NUMBER</label>
                  <input
                    type="number"
                    value={memberForm.number}
                    onChange={(e) => setMemberForm({ ...memberForm, number: e.target.value })}
                    placeholder="7..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">ACTIVE ROLE POSITION</label>
                  <input
                    type="text"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    placeholder="Striker, Midfielder, Defender, Sprinter..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-500 text-xs font-sans font-bold py-2.5 px-5 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Confirm & Enlist Member
                </button>
              </div>
            </form>
          )}

          {/* TAB CONTENT 5: ADD GAME / SPORT CATEGORY (ADMIN) */}
          {activeTab === "games" && (
            <form onSubmit={handleAddGame} className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Dribbble className="w-4 h-4 text-blue-500" /> Configure Dynamic Sport Games Categories
                </h3>
                <p className="text-xs text-gray-400">Add a new dynamic sport category (e.g. Lawn Tennis, Chess, Rugby). Adding it instantly seeds filters.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  placeholder="Type new sport name, e.g. Lawn Tennis..."
                  className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 flex-1 ${
                    theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                  }`}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-2.5 font-sans font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Add Sport
                </button>
              </div>

              {/* Present sport indicators list feedback */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 block mb-2.5 uppercase font-bold">Currently Registered Dynamic Sports:</span>
                <div className="flex flex-wrap gap-2">
                  {gamesList.map((g) => (
                    <span
                      key={g}
                      className={`text-xs px-3 py-1 border rounded-lg font-mono font-bold capitalize flex items-center gap-1 ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-blue-550" /> {g.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB CONTENT 6: AWARDS CONFERAL (ADMIN) */}
          {activeTab === "awards" && (
            <form onSubmit={handleAwardMedal} className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <AwardIcon className="w-4 h-4 text-amber-500" /> Confer Medals & Category Awards
                </h3>
                <p className="text-xs text-gray-400">Award dynamic MVP plaques, MVP medals, or highest goal accolades directly onto select sport displays.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">AWARD CLASSIFICATION NAME</label>
                  <select
                    value={awardForm.name}
                    onChange={(e) => setAwardForm({ ...awardForm, name: e.target.value })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    <option value="">-- Select Award Title --</option>
                    {awardForm.sport === "football" && (
                      <>
                        <option value="⚽ Highest Goal Scorer">⚽ Highest Goal Scorer</option>
                        <option value="🧤 Best Goalkeeper (Golden Glove)">🧤 Best Goalkeeper (Golden Glove)</option>
                        <option value="⭐ Tournament Most Valuable Player (MVP)">⭐ Tournament Most Valuable Player (MVP)</option>
                        <option value="🛡️ Best Defender of the Tournament">🛡️ Best Defender of the Tournament</option>
                      </>
                    )}
                    {awardForm.sport === "table_tennis" && (
                      <>
                        <option value="🥇 Table Tennis Singles Champion (Gold)">🥇 Table Tennis Singles Champion (Gold)</option>
                        <option value="🥈 Singles Runner-up">🥈 Singles Runner-up</option>
                        <option value="🔥 Most Determined Smasher">🔥 Most Determined Smasher</option>
                        <option value="🤝 Best Fair Play Award">🤝 Best Fair Play Award</option>
                      </>
                    )}
                    {awardForm.sport === "volleyball" && (
                      <>
                        <option value="⭐ Volleyball Tournament MVP">⭐ Volleyball Tournament MVP</option>
                        <option value="⚡ Best Server Award">⚡ Best Server Award</option>
                        <option value="💥 Best Opposite Spiker">💥 Best Opposite Spiker</option>
                        <option value="🛡️ Best Libero / Defensive Master">🛡️ Best Libero / Defensive Master</option>
                      </>
                    )}
                    {awardForm.sport === "athletics" && (
                      <>
                        <option value="🏃 Fastest Male Sprinter (100m Gold)">🏃 Fastest Male Sprinter (100m Gold)</option>
                        <option value="⚡ Fastest Female Sprinter (200m Gold)">⚡ Fastest Female Sprinter (200m Gold)</option>
                        <option value="🤝 4x100m Relay Gold Medal Winners">🤝 4x100m Relay Gold Medal Winners</option>
                        <option value="🌟 Rising Star Track Athlete">🌟 Rising Star Track Athlete</option>
                      </>
                    )}
                    <option value="Custom Award">Custom (Type below...)</option>
                  </select>

                  {/* Fallback custom input field if "Custom Award" selected or doesn't match standard catalog */}
                  {(![
                    "⚽ Highest Goal Scorer",
                    "🧤 Best Goalkeeper (Golden Glove)",
                    "⭐ Tournament Most Valuable Player (MVP)",
                    "🛡️ Best Defender of the Tournament",
                    "🥇 Table Tennis Singles Champion (Gold)",
                    "🥈 Singles Runner-up",
                    "🔥 Most Determined Smasher",
                    "🤝 Best Fair Play Award",
                    "⭐ Volleyball Tournament MVP",
                    "⚡ Best Server Award",
                    "💥 Best Opposite Spiker",
                    "🛡️ Best Libero / Defensive Master",
                    "🏃 Fastest Male Sprinter (100m Gold)",
                    "⚡ Fastest Female Sprinter (200m Gold)",
                    "🤝 4x100m Relay Gold Medal Winners",
                    "🌟 Rising Star Track Athlete"
                  ].includes(awardForm.name) || awardForm.name === "Custom Award") && (
                    <input
                      type="text"
                      required
                      value={awardForm.name === "Custom Award" ? "" : awardForm.name}
                      onChange={(e) => setAwardForm({ ...awardForm, name: e.target.value })}
                      placeholder="Type custom award name..."
                      className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full mt-2 ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    />
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">CLASH SPORT</label>
                  <select
                    value={awardForm.sport}
                    onChange={(e) => setAwardForm({ ...awardForm, sport: e.target.value })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    {gamesList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">AWARD CATEGORY</label>
                  <select
                    value={awardForm.category}
                    onChange={(e) => setAwardForm({ ...awardForm, category: e.target.value as any })}
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    <option value="individual">Individual MVP Award</option>
                    <option value="team">Team Club Trophy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">RECIPIENT NAME</label>
                  <input
                    type="text"
                    required
                    value={awardForm.recipientName}
                    onChange={(e) => setAwardForm({ ...awardForm, recipientName: e.target.value })}
                    placeholder="John Effiong, or Saint Patrick parish team..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">ASSOCIATED PARISH</label>
                  <input
                    type="text"
                    value={awardForm.teamName}
                    onChange={(e) => setAwardForm({ ...awardForm, teamName: e.target.value })}
                    placeholder="St. Patrick's Parish..."
                    className={`text-xs p-2 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">CONFER MESSAGE DETAILS (OPTIONAL)</label>
                <textarea
                  value={awardForm.details}
                  onChange={(e) => setAwardForm({ ...awardForm, details: e.target.value })}
                  placeholder="Clocked a record 10.42 seconds at Saint Patrick tracks, securing the gold medal..."
                  rows={2}
                  className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                    theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-500 text-xs font-sans font-bold py-2.5 px-5 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Confer Award Medal
                </button>
              </div>
            </form>
          )}

          {/* TAB CONTENT: MEDIA STORY MANAGER (ADMIN) */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <form onSubmit={handlePostMedia} className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    📢 Host Digital Media Stories
                  </h3>
                  <p className="text-xs text-gray-400">
                    Publish high-momentum picture snaps, audios, and video reels directly into the persistent database.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">STORY TITLE / DESCRIPTION</label>
                    <input
                      type="text"
                      required
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="e.g. St. Patrick's volleyball champions gold-winning point!"
                      className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-505 focus:border-amber-500 w-full ${
                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-gray-400 block mb-1">MEDIA TYPE</label>
                      <select
                        value={mediaType}
                        onChange={(e) => {
                          setMediaType(e.target.value as any);
                          setMediaUrl("");
                        }}
                        className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                          theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                        }`}
                      >
                        <option value="image">🖼️ Picture Snap</option>
                        <option value="audio">🔊 Sound Clip</option>
                        <option value="video">🎥 Video Reel</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-400 block mb-1">FEED CATEGORY</label>
                      <select
                        value={mediaCategory}
                        onChange={(e) => setMediaCategory(e.target.value as any)}
                        className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-505 focus:border-amber-500 w-full ${
                          theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                        }`}
                      >
                        <option value="recent">Recent Snap</option>
                        <option value="live">Live Now</option>
                        <option value="upcoming">Upcoming</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-400 block mb-1">LINKED MATCH</label>
                      <select
                        value={mediaMatchId}
                        onChange={(e) => setMediaMatchId(e.target.value)}
                        className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-505 focus:border-amber-500 w-full ${
                          theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                        }`}
                      >
                        <option value="">-- Optional Correlation --</option>
                        {db.matches.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.sport.toUpperCase()} | {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* DRAG AND DROP FILE ZONE */}
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">BINARY STREAM FILE UPLOAD</label>
                  
                  {fileError && (
                    <div className="text-[11px] font-mono text-red-500 mb-2 font-bold">{fileError}</div>
                  )}

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      dragActive
                        ? "border-amber-500 bg-amber-500/10 text-amber-500"
                        : theme === "dark"
                          ? "border-zinc-800 hover:border-zinc-700 bg-black/20 text-gray-400"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <input
                      type="file"
                      id="admin-media-file"
                      accept={
                        mediaType === "image"
                          ? "image/*"
                          : mediaType === "audio"
                            ? "audio/*"
                            : "video/*"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file);
                      }}
                      className="hidden"
                    />
                    
                    <label htmlFor="admin-media-file" className="cursor-pointer space-y-2 flex flex-col items-center">
                      <span className="p-3 rounded-full bg-amber-500/10 text-amber-550 text-xl block">
                        📁
                      </span>
                      <div className="text-xs font-bold font-sans">
                        Drag & drop local {mediaType} component, or click to browse files
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Supports local mp3, wav, images, and visual clips • Auto-encoded directly in DB
                      </div>
                    </label>

                    {mediaUrl && (
                      <div className="mt-4 w-full max-w-sm p-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-mono rounded-lg border border-emerald-500/20 flex items-center justify-between">
                        <span className="truncate flex-1 text-left">✔ Local file encoded ({mediaUrl.slice(0, 35)}...)</span>
                        <button
                          type="button"
                          onClick={() => setMediaUrl("")}
                          className="ml-2 hover:text-red-500 text-xs font-black px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 block font-bold">OR PASTE EXTERNAL DIRECT URL LINK (BACKFILL PATHWAY)</label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Alternatively, paste external link (e.g. YouTube clip URL, or direct internet media address)"
                    className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-amber-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-black uppercase tracking-wider py-2.5 px-6 rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    🚀 Publish Media Story
                  </button>
                </div>
              </form>

              {/* Feed Management Board */}
              <div className="border-t border-zinc-800/20 dark:border-zinc-800/60 pt-6">
                <h4 className="text-xs font-mono font-black tracking-widest text-zinc-400 uppercase mb-3 text-left">
                  Manage Active Snippets ({(db.mediaPosts || []).length})
                </h4>

                {(db.mediaPosts || []).length === 0 ? (
                  <div className="text-xs text-gray-500 italic font-mono p-4 border border-zinc-850 rounded-xl">
                    📦 No active stories inside memory stream. Upload one above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(db.mediaPosts || []).map((post) => (
                      <div
                        key={post.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          theme === "dark" ? "bg-black/35 border-white/5" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest leading-none">
                            {post.mediaType} • {post.category}
                          </span>
                          <h5 className={`text-xs font-sans font-extrabold truncate mt-1 leading-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {post.title}
                          </h5>
                          <span className="text-[9px] font-mono text-zinc-500 block mt-0.5 leading-none">
                            Uploaded {post.timestamp.split(" ")[0]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this media post?")) {
                              handleDeletePost(post.id);
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-2.5 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                          title="Delete media post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 7: BROADCAST NOTIFICATIONS (ADMIN) */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className={`text-sm font-sans font-black flex items-center gap-1.5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  <Megaphone className="w-4 h-4 text-blue-500" /> Circular push Notification Broadcast
                </h3>
                <p className="text-xs text-gray-400">Push simulated message circulars regarding weather, schedule delay or ground results.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">BROADCAST NOTIFICATION HEADER</label>
                  <input
                    type="text"
                    required
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    placeholder="Rain Delay warning, Roster changes..."
                    className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">LINKED CHIEF SPORT CATEGORY</label>
                  <select
                    value={notifForm.sport}
                    onChange={(e) => setNotifForm({ ...notifForm, sport: e.target.value as any })}
                    className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                      theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                    }`}
                  >
                    <option value="all">Universal General (All Spectators)</option>
                    {gamesList.map((g) => (
                      <option key={g} value={g}>
                        {g} Event
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">LIVELY BODY DESCRIPTIVE PARAGRAPH</label>
                <textarea
                  required
                  value={notifForm.body}
                  onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                  placeholder="Heavy rain forecast over Saint Patrick field in Calabar. Volleyball sand games safely moved back by 40 minutes..."
                  rows={3}
                  className={`text-xs p-2.5 rounded-xl border focus:outline-none focus:border-blue-500 w-full ${
                    theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-slate-205 text-slate-800"
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-500 text-xs font-sans font-bold py-2.5 px-5 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Broadcast Circular Alerts
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  className={`border text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-black/30 border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                  }`}
                  title="Reset database to initial clean state"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-seed Fresh Database
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
