import { TournamentDb, Team, Player, Match, Award, PushNotification, MediaPost, UserAccount } from "./types";

export const initialTeams: Team[] = [];

export const initialPlayers: Player[] = [];

export const initialMatches: Match[] = [];

export const initialAwards: Award[] = [];

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
