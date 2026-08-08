import { TournamentDb, Team, Player, Match, Award, PushNotification, MediaPost, UserAccount } from "./types";

export const initialTeams: Team[] = [
  {
    id: "team-st-patrick",
    name: "St. Patrick's Cathedral Parish",
    logoColor: "bg-amber-500 text-slate-900",
    logoUrl: "/altar_server_logo.jpg",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  },
  {
    id: "team-sacred-heart",
    name: "Sacred Heart Parish, Calabar",
    logoColor: "bg-red-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  },
  {
    id: "team-st-mary",
    name: "St. Mary's Pro-Cathedral",
    logoColor: "bg-sky-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1543872084-c7bd3822856f?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  },
  {
    id: "team-holy-trinity",
    name: "Holy Trinity Parish",
    logoColor: "bg-emerald-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  },
  {
    id: "team-st-joseph",
    name: "St. Joseph's Parish, Atu",
    logoColor: "bg-indigo-600 text-white",
    logoUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  },
  {
    id: "team-st-paul",
    name: "St. Paul's Parish, Atimbo",
    logoColor: "bg-purple-500 text-white",
    logoUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=200&q=80",
    sport: "all",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    stats: { gd: 0 }
  }
];

export const initialPlayers: Player[] = [
  { id: "p1", name: "Emmanuel Archibong", teamId: "team-st-patrick", sport: "football", number: 10, role: "Captain / Forward", stats: { goals: 0, appearances: 0 } },
  { id: "p2", name: "Dominic Bassey", teamId: "team-sacred-heart", sport: "football", number: 7, role: "Striker", stats: { goals: 0, appearances: 0 } },
  { id: "p3", name: "Gabriel Okon", teamId: "team-st-mary", sport: "table_tennis", number: 1, role: "Singles Seed 1", stats: { setsWon: 0, matchesPlayed: 0 } },
  { id: "p4", name: "Michael Edet", teamId: "team-holy-trinity", sport: "volleyball", number: 4, role: "Spiker", stats: { blocks: 0, aces: 0 } }
];

export const initialMatches: Match[] = [];

export const initialAwards: Award[] = [];

export const initialNotifications: PushNotification[] = [];

export const initialMediaPosts: MediaPost[] = [];

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
  games: ["football", "table_tennis", "volleyball", "athletics"],
  version: 1,
  accounts: initialAccounts,
  mediaPosts: initialMediaPosts
};
