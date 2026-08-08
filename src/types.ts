export type SportType = string;

export type UserRole = "spectator" | "coordinator" | "admin";

export interface Team {
  id: string;
  name: string;
  logoColor: string; // e.g., "bg-red-500", "bg-blue-500"
  sport: SportType;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  stats: Record<string, string | number>;
  isSuspended?: boolean; // suspension indicator
  logoUrl?: string; // New church/parish logo URL
}

export interface PlayerStats {
  goals?: number;
  assists?: number;
  points?: number;
  setsWon?: number;
  matchesPlayed?: number;
  avgTimeSeconds?: number;
  bestTimeSeconds?: number;
  blocks?: number;
  aces?: number;
  appearances?: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string; // or "individual" for individual athletes
  sport: SportType;
  number: number;
  role: string; // e.g. "Striker", "Goalie", "Runner"
  stats: PlayerStats;
}

export interface AthleticsRunner {
  playerId: string;
  playerName: string;
  teamName: string;
  lane: number;
  timeSeconds?: number;
  rank?: number;
  reactionTime?: number;
}

export interface Match {
  id: string;
  sport: SportType;
  stage: string; // "Group Stage", "Quarter-final", "Semi-final", "Final", "Heat 1", "Final Race"
  teamAId?: string; // Empty for individual athletics
  teamBId?: string; // Empty for individual athletics
  scoreA?: number;
  scoreB?: number;
  date: string; // e.g. "Aug 9, 2026"
  time: string; // e.g. "10:00"
  status: "upcoming" | "live" | "finished";
  venue: string; // e.g., "Central Stadium", "Indoor Pavilion", "Volleyball Court", "Main Running Track"
  livePeriod?: string; // e.g. "1st Half", "Set 1", "Set 3", "Lap 1"
  liveTime?: string; // e.g. "23:45", "11th Point"
  liveSetsDetail?: {
    setsA: number[];
    setsB: number[];
  };
  liveScoreLogs?: Array<{
    type: string; // "goal" | "point"| "sub" | "card"
    teamId?: string;
    playerName?: string;
    detail: string;
    time: string;
  }>;
  runners?: AthleticsRunner[]; // For athletics
}

export interface Award {
  id: string;
  sport: SportType | "all";
  name: string; // "Gold", "Silver", "Bronze", "MVP", "Golden Boot", "Best Spiker"
  category: "team" | "individual";
  recipientName: string;
  teamName?: string;
  details?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  sport?: SportType | "all";
  timestamp: string;
  matchId?: string;
  read?: boolean;
}

export interface VenueInfo {
  name: string;
  id: string;
  icon: string;
  coords: { x: number; y: number };
  capacity: string;
  sportsInvolved: SportType[];
  description: string;
  pathFromMainEntrance: string; // Directions list
  svgCoordinates: string; // SVG path string for navigation tracing
}

export interface UserAccount {
  username: string;
  nickname: string;
  password?: string;
  email?: string;
  preferences?: {
    starredParishes?: string[];
  };
}

export interface MediaPost {
  id: string;
  matchId?: string;
  mediaType: "image" | "video" | "audio";
  title: string;
  url: string;
  likes: string[]; // List of username string who liked this
  reactions?: Record<string, string[]>; // Map of emoji -> list of userIds who reacted
  timestamp: string;
  category: "recent" | "live" | "upcoming";
  author: string;
}

export interface TournamentDb {
  teams: Team[];
  players: Player[];
  matches: Match[];
  awards: Award[];
  notifications: PushNotification[];
  games?: string[];
  version: number;
  accounts?: UserAccount[];
  mediaPosts?: MediaPost[];
  unitLabel?: "parish" | "deanery" | "club" | "zone";
  simulationEnabled?: boolean;
}
