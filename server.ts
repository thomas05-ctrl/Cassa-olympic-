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
