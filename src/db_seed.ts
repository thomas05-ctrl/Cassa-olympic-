import { TournamentDb, Team, Player, Match, Award, PushNotification, MediaPost, UserAccount } from "./types";

export const initialTeams: Team[] = [
  {
    id: "team-st-patrick",
    name: "St. Patrick's Cathedral Parish",
    logoColor: "bg-amber-500 text-slate-900",
    logoUrl: "/altar_server_logo.jpg",
    sport: "all",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    points: 7,
    stats: { gd: 4 }
  },
  {
    id: "team-sacred-heart",
    name: "Sacred Heart Parish, Calabar",
    logoColor: "bg-red-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 3,
    won: 2,
    drawn: 0,
    lost: 1,
    points: 6,
    stats: { gd: 3 }
  },
  {
    id: "team-st-mary",
    name: "St. Mary's Pro-Cathedral",
    logoColor: "bg-sky-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 3,
    won: 1,
    drawn: 1,
    lost: 1,
    points: 4,
    stats: { gd: 1 }
  },
  {
    id: "team-holy-trinity",
    name: "Holy Trinity Parish",
    logoColor: "bg-emerald-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 3,
    won: 1,
    drawn: 0,
    lost: 2,
    points: 3,
    stats: { gd: -1 }
  },
  {
    id: "team-st-joseph",
    name: "St. Joseph's Parish, Atu",
    logoColor: "bg-indigo-600 text-white",
    logoUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 3,
    won: 0,
    drawn: 1,
    lost: 2,
    points: 1,
    stats: { gd: -3 }
  },
  {
    id: "team-st-paul",
    name: "St. Paul's Parish, Atimbo",
    logoColor: "bg-purple-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 3,
    won: 0,
    drawn: 1,
    lost: 2,
    points: 1,
    stats: { gd: -4 }
  }
];

export const initialPlayers: Player[] = [
  { id: "p1", name: "Emmanuel Archibong", teamId: "team-st-patrick", sport: "football", number: 10, role: "Captain / Forward", stats: { goals: 5, appearances: 3 } },
  { id: "p2", name: "Dominic Bassey", teamId: "team-sacred-heart", sport: "football", number: 7, role: "Striker", stats: { goals: 4, appearances: 3 } },
  { id: "p3", name: "Gabriel Okon", teamId: "team-st-mary", sport: "table_tennis", number: 1, role: "Singles Seed 1", stats: { setsWon: 12, matchesPlayed: 4 } },
  { id: "p4", name: "Michael Edet", teamId: "team-holy-trinity", sport: "volleyball", number: 4, role: "Spiker", stats: { blocks: 8, aces: 5 } }
];

export const initialMatches: Match[] = [
  {
    id: "match-fb-live",
    sport: "football",
    stage: "Group A - Clash of Parishes",
    teamAId: "team-st-patrick",
    teamBId: "team-sacred-heart",
    scoreA: 2,
    scoreB: 1,
    status: "live",
    date: "Aug 9, 2026",
    time: "15:00",
    venue: "St. Patrick's Main Arena",
    livePeriod: "2nd Half",
    liveTime: "78:12",
    liveScoreLogs: [
      { type: "goal", detail: "Goal by Emmanuel Archibong (St. Patrick's)", time: "12'", teamId: "team-st-patrick", playerName: "Emmanuel Archibong" },
      { type: "goal", detail: "Goal by Dominic Bassey (Sacred Heart)", time: "34'", teamId: "team-sacred-heart", playerName: "Dominic Bassey" },
      { type: "goal", detail: "Goal by Thomas Adariku (St. Patrick's)", time: "65'", teamId: "team-st-patrick", playerName: "Thomas Adariku" }
    ]
  },
  {
    id: "match-tt-1",
    sport: "table_tennis",
    stage: "Quarter-final 1",
    teamAId: "team-st-mary",
    teamBId: "team-holy-trinity",
    scoreA: 3,
    scoreB: 1,
    status: "finished",
    date: "Aug 9, 2026",
    time: "11:00",
    venue: "Indoor Sports Complex"
  },
  {
    id: "match-vb-1",
    sport: "volleyball",
    stage: "Group Stage",
    teamAId: "team-st-joseph",
    teamBId: "team-st-paul",
    scoreA: 2,
    scoreB: 3,
    status: "finished",
    date: "Aug 9, 2026",
    time: "13:30",
    venue: "Courtyard Court 2"
  }
];

export const initialAwards: Award[] = [
  { id: "aw-1", sport: "football", name: "Gold Medal - Football Championship", category: "team", recipientName: "St. Patrick's Cathedral Parish", teamName: "St. Patrick's Cathedral Parish", details: "Champion of CASSA Archdiocesan Tournament" },
  { id: "aw-2", sport: "table_tennis", name: "Gold Medal - Table Tennis Singles", category: "individual", recipientName: "Gabriel Okon", teamName: "St. Mary's Pro-Cathedral", details: "Unbeaten in 5 consecutive sets" }
];

export const initialNotifications: PushNotification[] = [];

export const initialMediaPosts: MediaPost[] = [
  {
    id: "post-1",
    matchId: "match-fb-live",
    mediaType: "image",
    title: "Opening Ceremony and Inaugural Kickoff Clash at St. Patrick's",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=85",
    likes: ["specialist", "fan2026"],
    timestamp: "Aug 9, 2026",
    category: "live",
    author: "Admin Desk"
  },
  {
    id: "post-2",
    matchId: "match-vb-live",
    mediaType: "video",
    title: "Incredible Net Block & Spikes Rally compilation from Set 1 - Volleyball",
    url: "https://www.youtube.com/embed/9bZkp7q19f0",
    likes: ["specialist"],
    timestamp: "Aug 9, 2026",
    category: "live",
    author: "Sports Analyst"
  },
  {
    id: "post-3",
    matchId: "match-at-1",
    mediaType: "image",
    title: "Unbelievable finish by Godwin Emmanuel in Heat 1",
    url: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=85",
    likes: [],
    timestamp: "Aug 9, 2026",
    category: "recent",
    author: "Track Reporter"
  }
];

export const initialAccounts: UserAccount[] = [
  { username: "specialist", nickname: "Gamer God", password: "specialist123", email: "specialistgamergod@gmail.com" },
  { username: "fan2026", nickname: "Parish Fanatic", password: "fan2026password", email: "fan2026@parish.com" }
];

export const defaultDb: TournamentDb = {
  teams: initialTeams,
  players: initialPlayers,
  matches: initialMatches,
  awards: initialAwards,
  notifications: initialNotifications,
  simulationEnabled: false,
  games: ["football", "table_tennis", "volleyball", "athletics"],
  version: 1,
  accounts: initialAccounts,
  mediaPosts: initialMediaPosts
};
