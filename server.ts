import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { defaultDb } from "./src/db_seed";
import { TournamentDb, Match, PushNotification, Team } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure persistent folder exists
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read database
function readDb(): TournamentDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);

      // If data file was empty or missing core collections, initialize with default seed data
      const isUninitialized = (!parsed.teams || parsed.teams.length === 0) &&
                              (!parsed.matches || parsed.matches.length === 0) &&
                              (!parsed.mediaPosts || parsed.mediaPosts.length === 0);

      if (isUninitialized) {
        writeDb(defaultDb);
        return defaultDb;
      }

      // Fill in defaults for any undefined array fields
      if (!parsed.games) parsed.games = defaultDb.games || ["football", "table_tennis", "volleyball", "athletics"];
      if (parsed.accounts === undefined) parsed.accounts = defaultDb.accounts || [];
      if (parsed.mediaPosts === undefined) parsed.mediaPosts = defaultDb.mediaPosts || [];
      if (parsed.teams === undefined) parsed.teams = defaultDb.teams || [];
      if (parsed.players === undefined) parsed.players = defaultDb.players || [];
      if (parsed.matches === undefined) parsed.matches = defaultDb.matches || [];
      if (parsed.awards === undefined) parsed.awards = defaultDb.awards || [];
      if (parsed.notifications === undefined) parsed.notifications = defaultDb.notifications || [];
      if (parsed.unitLabel === undefined) parsed.unitLabel = "parish";

      // Ensure all teams are migrated to include their logoUrl
      if (parsed.teams) {
        parsed.teams = parsed.teams.map((t: any) => {
          const matchedSeed = defaultDb.teams.find(st => st.id === t.id);
          if (matchedSeed && !t.logoUrl) {
            t.logoUrl = matchedSeed.logoUrl;
          }
          return t;
        });
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, resetting to default...", err);
  }
  // Reset/seed if file doesn't exist or is corrupted
  writeDb(defaultDb);
  return defaultDb;
}

// Write database
function writeDb(data: TournamentDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// --- API ROUTES ---

// 1. Get Tournament Data
app.get("/api/tournament-data", (req, res) => {
  const db = readDb();
  res.json(db);
});

// 2. Put / Save / Merge Entire Tournament Data
app.post("/api/update-tournament", (req, res) => {
  const clientData = req.body;
  if (!clientData || typeof clientData !== "object") {
    return res.status(400).json({ error: "Invalid layout body" });
  }

  const serverDb = readDb();

  // 1. Merge Accounts: Union and update of accounts by username
  const mergedAccounts = [...(serverDb.accounts || [])];
  if (clientData.accounts) {
    clientData.accounts.forEach((acc: any) => {
      const idx = mergedAccounts.findIndex(x => x.username === acc.username);
      if (idx === -1) {
        mergedAccounts.push(acc);
      } else {
        mergedAccounts[idx] = { ...mergedAccounts[idx], ...acc };
      }
    });
  }

  // 2. Preserve media post Likes & reactions dynamically for posts present in clientData
  const clientMediaPosts = clientData.mediaPosts || [];
  const mergedMediaPosts = clientMediaPosts.map((clientPost: any) => {
    const servPost = (serverDb.mediaPosts || []).find((p: any) => p.id === clientPost.id);
    if (servPost) {
      const combinedLikes = Array.from(new Set([
        ...(clientPost.likes || []),
        ...(servPost.likes || [])
      ]));

      const servReactions = servPost.reactions || {};
      const clientReactions = clientPost.reactions || {};
      const combinedReactions: Record<string, string[]> = {};
      const allEmojis = ["👍", "🔥", "😅", "👏", "😭", "😕"];

      allEmojis.forEach(emoji => {
        const set = new Set([
          ...(servReactions[emoji] || []),
          ...(clientReactions[emoji] || [])
        ]);
        combinedReactions[emoji] = Array.from(set);
      });

      return {
        ...clientPost,
        likes: combinedLikes,
        reactions: combinedReactions
      };
    }
    return clientPost;
  });

  const finalDb: TournamentDb = {
    ...clientData,
    accounts: mergedAccounts,
    mediaPosts: mergedMediaPosts,
    unitLabel: clientData.unitLabel || serverDb.unitLabel || "parish",
    version: (serverDb.version || 0) + 1
  };

  writeDb(finalDb);
  res.json({ success: true, db: finalDb, version: finalDb.version });
});

// 2.5 Recieved Guest Toggle Reaction
app.post("/api/react-post", (req, res) => {
  const { postId, emoji, userId } = req.body;
  if (!postId || !emoji || !userId) {
    return res.status(400).json({ error: "postId, emoji, and userId are required parameters" });
  }

  const db = readDb();
  if (!db.mediaPosts) {
    db.mediaPosts = [];
  }

  const postIdx = db.mediaPosts.findIndex((p: any) => p.id === postId);
  if (postIdx === -1) {
    return res.status(404).json({ error: "Media post not found" });
  }

  const post = db.mediaPosts[postIdx];
  if (!post.reactions) {
    post.reactions = {};
  }
  if (!post.reactions[emoji]) {
    post.reactions[emoji] = [];
  }

  const userIndex = post.reactions[emoji].indexOf(userId);
  if (userIndex === -1) {
    post.reactions[emoji].push(userId);
  } else {
    post.reactions[emoji].splice(userIndex, 1);
  }

  db.version += 1;
  writeDb(db);
  res.json({ success: true, db });
});

// 3. Reset Tournament Data
app.post("/api/reset-data", (req, res) => {
  writeDb(defaultDb);
  res.json({ success: true, db: defaultDb });
});

// 4. Send circular administrative Push Notification
app.post("/api/send-notification", (req, res) => {
  const { title, body, sport } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required." });
  }

  const db = readDb();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newNotif: PushNotification = {
    id: `not-admin-${Date.now()}`,
    title,
    body,
    sport: sport || "all",
    timestamp: timeStr
  };

  db.notifications.unshift(newNotif);
  db.version += 1;
  writeDb(db);

  res.json({ success: true, notification: newNotif, db });
});

// 5. Update custom Match Status & score logs directly (convenience REST)
app.post("/api/update-match", (req, res) => {
  const { matchId, scoreA, scoreB, status, livePeriod, liveTime, logDetail } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: "matchId is required" });
  }

  const db = readDb();
  const matchIdx = db.matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) {
    return res.status(404).json({ error: "Match not found" });
  }

  const match = db.matches[matchIdx];
  if (scoreA !== undefined) match.scoreA = Number(scoreA);
  if (scoreB !== undefined) match.scoreB = Number(scoreB);
  if (status) match.status = status;
  if (livePeriod) match.livePeriod = livePeriod;
  if (liveTime) match.liveTime = liveTime;

  if (logDetail) {
    if (!match.liveScoreLogs) match.liveScoreLogs = [];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    match.liveScoreLogs.unshift({
      type: "point",
      detail: logDetail,
      time: liveTime || timeStr
    });
  }

  // If match finished, we update Team Points
  if (status === "finished") {
    // Basic automatic updater for local leader standings
    const teamA = db.teams.find(t => t.id === match.teamAId);
    const teamB = db.teams.find(t => t.id === match.teamBId);
    if (teamA && teamB && scoreA !== undefined && scoreB !== undefined) {
      teamA.played += 1;
      teamB.played += 1;
      
      const glA = Number(scoreA);
      const glB = Number(scoreB);

      if (match.sport === "football") {
        const statsA = teamA.stats as { goalsFor: number; goalsAgainst: number; gd: number };
        const statsB = teamB.stats as { goalsFor: number; goalsAgainst: number; gd: number };
        if (statsA) {
          statsA.goalsFor += glA;
          statsA.goalsAgainst += glB;
          statsA.gd = statsA.goalsFor - statsA.goalsAgainst;
        }
        if (statsB) {
          statsB.goalsFor += glB;
          statsB.goalsAgainst += glA;
          statsB.gd = statsB.goalsFor - statsB.goalsAgainst;
        }
      }

      if (glA > glB) {
        teamA.won += 1;
        teamA.points += match.sport === "football" ? 3 : 2;
        teamB.lost += 1;
      } else if (glB > glA) {
        teamB.won += 1;
        teamB.points += match.sport === "football" ? 3 : 2;
        teamA.lost += 1;
      } else {
        teamA.drawn += 1;
        teamB.drawn += 1;
        teamA.points += 1;
        teamB.points += 1;
      }
    }
  }

  db.version += 1;
  writeDb(db);
  res.json({ success: true, match, db });
});


// --- SERVER SIDE LIVE SIMULATION TICKER ---
// Simulates live match activity when it is turned on
setInterval(() => {
  const db = readDb();
  if (!db.simulationEnabled) return;

  let changed = false;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  db.matches = db.matches.map((match) => {
    if (match.status !== "live") return match;

    changed = true;
    
    // 1. Simulating Football Match
    if (match.sport === "football") {
      // Advance match minute
      let currentMin = 0;
      if (match.liveTime) {
        currentMin = parseInt(match.liveTime.split(":")[0]) || 0;
      }
      currentMin += 1;
      match.liveTime = `${currentMin}:00`;

      // End of match simulation
      if (currentMin >= 90) {
        match.status = "finished";
        match.livePeriod = "Full Time";
        
        // Add final notification
        db.notifications.unshift({
          id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          title: `Match Finished: Football`,
          body: `The match concluded. Final Score: ${getTeamName(db.teams, match.teamAId)} ${match.scoreA} - ${match.scoreB} ${getTeamName(db.teams, match.teamBId)}`,
          sport: "football",
          timestamp: timeStr,
          matchId: match.id
        });
        return match;
      }

      // Random goal simulation (1.5% chance per second per game)
      if (Math.random() < 0.15) {
        const isTeamA = Math.random() < 0.53; // slight bias for home/team A
        if (isTeamA) {
          match.scoreA = (match.scoreA || 0) + 1;
        } else {
          match.scoreB = (match.scoreB || 0) + 1;
        }

        const teamId = isTeamA ? match.teamAId : match.teamBId;
        const teamName = getTeamName(db.teams, teamId);
        
        // Get random player stat update
        const players = db.players.filter(p => p.teamId === teamId);
        const player = players[Math.floor(Math.random() * players.length)];
        const playerName = player ? player.name : "Substitute Winger";

        if (player) {
          player.stats.goals = (player.stats.goals || 0) + 1;
        }

        const details = `FANTASTIC GOAL! ${playerName} converts with a brilliant team maneuver!`;
        if (!match.liveScoreLogs) match.liveScoreLogs = [];
        match.liveScoreLogs.unshift({
          type: "goal",
          teamId,
          playerName,
          detail: details,
          time: `${currentMin}'`
        });

        // Add real-time feed notification
        db.notifications.unshift({
          id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          title: `GOAL! ${teamName} Scores!`,
          body: `Football live score: ${getTeamName(db.teams, match.teamAId)} ${match.scoreA} - ${match.scoreB} ${getTeamName(db.teams, match.teamBId)} (${currentMin}')`,
          sport: "football",
          timestamp: timeStr,
          matchId: match.id
        });
      }
    }

    // 2. Simulating Table Tennis
    else if (match.sport === "table_tennis") {
      let isPointA = Math.random() < 0.5;
      
      if (!match.liveSetsDetail) {
        match.liveSetsDetail = { setsA: [0], setsB: [0] };
      }
      
      const sDetail = match.liveSetsDetail;
      const activeSetIdx = sDetail.setsA.length - 1;
      
      if (isPointA) {
        sDetail.setsA[activeSetIdx] = (sDetail.setsA[activeSetIdx] || 0) + 1;
      } else {
        sDetail.setsB[activeSetIdx] = (sDetail.setsB[activeSetIdx] || 0) + 1;
      }

      const pA = sDetail.setsA[activeSetIdx];
      const pB = sDetail.setsB[activeSetIdx];

      match.liveTime = `Point: ${pA}-${pB}`;

      // Check if someone won the set (at least 11 points and leading by 2)
      if ((pA >= 11 || pB >= 11) && Math.abs(pA - pB) >= 2) {
        if (pA > pB) {
          match.scoreA = (match.scoreA || 0) + 1;
        } else {
          match.scoreB = (match.scoreB || 0) + 1;
        }

        const teamNameWinner = pA > pB ? getTeamName(db.teams, match.teamAId) : getTeamName(db.teams, match.teamBId);
        
        if (!match.liveScoreLogs) match.liveScoreLogs = [];
        match.liveScoreLogs.unshift({
          type: "point",
          detail: `Set ${activeSetIdx + 1} finished: ${pA}-${pB} won by ${teamNameWinner}.`,
          time: `Set ${activeSetIdx + 1}`
        });

        db.notifications.unshift({
          id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          title: `Table Tennis: Set ${activeSetIdx + 1} Cleared`,
          body: `${teamNameWinner} secures the set! Match score: ${match.scoreA} - ${match.scoreB}`,
          sport: "table_tennis",
          timestamp: timeStr,
          matchId: match.id
        });

        // Check match finish: Best of 5 (first to 3 sets)
        if ((match.scoreA || 0) >= 3 || (match.scoreB || 0) >= 3) {
          match.status = "finished";
          match.livePeriod = "Finished";
          match.liveTime = `Sets: ${match.scoreA}-${match.scoreB}`;
          
          db.notifications.unshift({
            id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            title: `Match Finished: Table Tennis`,
            body: `${pA > pB ? getTeamName(db.teams, match.teamAId) : getTeamName(db.teams, match.teamBId)} clinches the victory ${match.scoreA}-${match.scoreB}!`,
            sport: "table_tennis",
            timestamp: timeStr,
            matchId: match.id
          });
        } else {
          // Initialize next set
          sDetail.setsA.push(0);
          sDetail.setsB.push(0);
          match.livePeriod = `Set ${sDetail.setsA.length}`;
        }
      }
    }

    // 3. Simulating Volleyball
    else if (match.sport === "volleyball") {
      let isPoint = Math.random() < 0.5;
      if (!match.liveSetsDetail) {
        match.liveSetsDetail = { setsA: [0], setsB: [0] };
      }
      const sDetail = match.liveSetsDetail;
      const currentSetIdx = sDetail.setsA.length - 1;

      if (isPoint) {
        sDetail.setsA[currentSetIdx] = (sDetail.setsA[currentSetIdx] || 0) + 1;
      } else {
        sDetail.setsB[currentSetIdx] = (sDetail.setsB[currentSetIdx] || 0) + 1;
      }

      const pA = sDetail.setsA[currentSetIdx];
      const pB = sDetail.setsB[currentSetIdx];
      
      // Volleyball set standard: 25 points. Set 5 is to 15.
      const winningPoints = currentSetIdx === 4 ? 15 : 25;
      match.liveTime = `Score: ${pA}-${pB}`;

      if ((pA >= winningPoints || pB >= winningPoints) && Math.abs(pA - pB) >= 2) {
        if (pA > pB) {
          match.scoreA = (match.scoreA || 0) + 1;
        } else {
          match.scoreB = (match.scoreB || 0) + 1;
        }

        const setterWinner = pA > pB ? getTeamName(db.teams, match.teamAId) : getTeamName(db.teams, match.teamBId);
        
        if (!match.liveScoreLogs) match.liveScoreLogs = [];
        match.liveScoreLogs.unshift({
          type: "point",
          detail: `Set ${currentSetIdx + 1} finished: ${pA}-${pB} won by ${setterWinner}.`,
          time: `Set ${currentSetIdx + 1}`
        });

        db.notifications.unshift({
          id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          title: `Volleyball: Set ${currentSetIdx + 1} Won`,
          body: `${setterWinner} takes set ${currentSetIdx + 1} (${pA}-${pB}). Match sets standing: ${match.scoreA}-${match.scoreB}`,
          sport: "volleyball",
          timestamp: timeStr,
          matchId: match.id
        });

        // Best of 5 sets (first to 3 sets)
        if ((match.scoreA || 0) >= 3 || (match.scoreB || 0) >= 3) {
          match.status = "finished";
          match.livePeriod = "Finished";
          match.liveTime = `Sets: ${match.scoreA}-${match.scoreB}`;

          db.notifications.unshift({
            id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            title: `Match Finished: Volleyball`,
            body: `Championship win for ${pA > pB ? getTeamName(db.teams, match.teamAId) : getTeamName(db.teams, match.teamBId)}: ${match.scoreA}-${match.scoreB}!`,
            sport: "volleyball",
            timestamp: timeStr,
            matchId: match.id
          });
        } else {
          sDetail.setsA.push(0);
          sDetail.setsB.push(0);
          match.livePeriod = `Set ${sDetail.setsA.length}`;
        }
      }
    }

    // 4. Simulating Athletics (Heat racing run)
    else if (match.sport === "athletics") {
      if (match.livePeriod === "Preparation / Lineup") {
        if (Math.random() < 0.20) {
          match.livePeriod = "Sprinting - Race Active";
          match.liveTime = "Running 100m";
          
          if (!match.liveScoreLogs) match.liveScoreLogs = [];
          match.liveScoreLogs.unshift({
            type: "point",
            detail: "GUNSHOT FIRED! The race is underway. Start reactions are immaculate!",
            time: "0.0s"
          });

          db.notifications.unshift({
            id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            title: `Athletics: Race Started!`,
            body: `${match.stage} is underway now! Stand by for photo-finish calculations.`,
            sport: "athletics",
            timestamp: timeStr,
            matchId: match.id
          });
        }
      } else if (match.livePeriod === "Sprinting - Race Active") {
        // Complete the race
        match.status = "finished";
        match.livePeriod = "Full Results";
        match.liveTime = "Finished";

        // Assign mock times
        if (match.runners) {
          const generatedTimes = [9.79, 9.81, 9.88, 9.92].map(t => +(t + Math.random() * 0.1).toFixed(2));
          // Sort times to rank
          const rankedRunners = [...match.runners].map((runner, idx) => {
            runner.reactionTime = +(0.11 + Math.random() * 0.06).toFixed(3);
            runner.timeSeconds = generatedTimes[idx];
            return runner;
          }).sort((r1, r2) => (r1.timeSeconds || 0) - (r2.timeSeconds || 0));

          match.runners = rankedRunners.map((runner, rIdx) => {
            runner.rank = rIdx + 1;
            
            // Assign records
            const dbPlayer = db.players.find(p => p.id === runner.playerId);
            if (dbPlayer && runner.timeSeconds) {
              dbPlayer.stats.avgTimeSeconds = dbPlayer.stats.avgTimeSeconds 
                ? +((dbPlayer.stats.avgTimeSeconds + runner.timeSeconds) / 2).toFixed(2)
                : runner.timeSeconds;
              dbPlayer.stats.bestTimeSeconds = dbPlayer.stats.bestTimeSeconds 
                ? Math.min(dbPlayer.stats.bestTimeSeconds, runner.timeSeconds)
                : runner.timeSeconds;
            }

            return runner;
          });

          const goldWinner = match.runners[0];
          
          db.notifications.unshift({
            id: `sim-not-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            title: `Athletics: ${goldWinner.playerName} wins!`,
            body: `${goldWinner.playerName} takes Gold in ${match.stage}! Final time: ${goldWinner.timeSeconds}s.`,
            sport: "athletics",
            timestamp: timeStr,
            matchId: match.id
          });

          // Seed gold winner to awards
          db.awards.unshift({
            id: `aw-sim-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            sport: "athletics",
            name: `Gold Medal (${match.stage})`,
            category: "individual",
            recipientName: goldWinner.playerName,
            teamName: goldWinner.teamName,
            details: `Crossed the finish line with an incredible final kick in ${goldWinner.timeSeconds}s!`
          });
        }
      }
    }

    return match;
  });

  if (changed) {
    db.version += 1;
    writeDb(db);
  }
}, 8000); // Trigger live ticks every 8 seconds

function getTeamName(teams: Team[], teamId?: string): string {
  if (!teamId) return "Athlete";
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "TBD";
}


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sports Championships] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
