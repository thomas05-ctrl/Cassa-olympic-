import React, { useState } from "react";
import { MapPin, Navigation, Compass, Info, Trophy, Clock, Globe } from "lucide-react";
import { Match, SportType } from "../types";

interface MapNavigationProps {
  matches: Match[];
  theme?: string;
  onSelectMatchSport?: (sport: SportType) => void;
}

interface Venue {
  id: string;
  name: string;
  sport: SportType | "all";
  x: number;
  y: number;
  capacity: string;
  directions: string[];
  description: string;
  pathPoints: string; // SVG line path e.g. "M 250 360 L 150 250 L 100 130"
}

export default function MapNavigation({ matches, theme, onSelectMatchSport }: MapNavigationProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string>("fb-stadium");
  const [showPath, setShowPath] = useState(true);
  const [mapMode, setMapMode] = useState<"blueprint" | "live">("blueprint");

  const venues: Venue[] = [
    {
      id: "fb-stadium",
      name: "St. Patrick's Football Arena (Parish Field)",
      sport: "football",
      x: 100,
      y: 100,
      capacity: "12,000 Capacity",
      description: "Primary turf grass arena host field at St. Patrick's Catholic Church, fitted with surrounding fan tents, local press boxes and primary team banners.",
      directions: [
        "From Main Highway Gate, walk straight North-West past the church assembly foyer.",
        "Pass the Parish Priest office building & custom refreshment stand on your right.",
        "Take the direct sideline gate entrance to sit in designated spectator blocks."
      ],
      pathPoints: "M 250 360 L 150 240 L 100 120"
    },
    {
      id: "tt-hall",
      name: "St. Patrick's Table Tennis Pavilion (Youth Hall)",
      sport: "table_tennis",
      x: 400,
      y: 100,
      capacity: "1,500 Seats",
      description: "High-speed climate controlled indoor arena housed in the central Catholic Parish Youth Hall with clean table layouts.",
      directions: [
        "From Main Gate, walk North-East past the church bell tower.",
        "Pass the Saint Patrick statue garden loop.",
        "Enter through the double wooden glass doors of the Youth Assembly Hall B."
      ],
      pathPoints: "M 250 360 L 350 240 L 400 120"
    },
    {
      id: "vb-court",
      name: "St. Patrick's Volleyball Center (Sand Court)",
      sport: "volleyball",
      x: 120,
      y: 260,
      capacity: "2,000 Seats",
      description: "Custom sand-filled court and indoor compound designed for local high-flying CASSA volley clashes.",
      directions: [
        "From Main Gate, take an immediate left path.",
        "Walk past the Parish Car Park and first aid tent for 40 meters.",
        "The beach volleyball arena and fencing boundaries will be straight ahead."
      ],
      pathPoints: "M 250 360 L 170 300 L 120 260"
    },
    {
      id: "at-track",
      name: "Parish Athletics Circuit Outline",
      sport: "athletics",
      x: 380,
      y: 260,
      capacity: "3,500 Seats",
      description: "Marked turf and composite circuit surrounding the fields for individual and relay championship athletics races.",
      directions: [
        "From Main Gate, Walk along the main east walkway corridor.",
        "Pass the community youth center building.",
        "Proceed directly onto the outer composite athletic lane tracks."
      ],
      pathPoints: "M 250 360 L 330 300 L 380 260"
    },
    {
      id: "main-gate",
      name: "St. Patrick's Parish Main Highway Gate",
      sport: "all",
      x: 250,
      y: 360,
      capacity: "Information Hub",
      description: "Primary entrance gateway situated right along Murtala Mohammed Highway, Ikot Ansa, Calabar. Security checkpoint, pass desk & primary greeting banner sits here.",
      directions: [
        "Secured drop-off loops on the Murtala Mohammed Highway border.",
        "Walk past security checks to receive physical wrist-bands.",
        "Main navigation signboards pointing towards church, fields, and youth pavilion."
      ],
      pathPoints: "M 250 360 L 250 360"
    }
  ];

  const activeVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  // Filter matches held at select venue
  const venueMatches = matches.filter((m) => {
    if (activeVenue.sport === "all") return false;
    return m.sport === activeVenue.sport;
  });

  return (
    <div className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-5 mb-16 font-sans transition-colors duration-200 ${
      theme === "dark" ? "text-gray-200" : "text-slate-800"
    }`}>
      {/* Visual Map Sandbox */}
      <div className={`lg:col-span-7 border rounded-2xl p-4 flex flex-col justify-between relative shadow-lg backdrop-blur-md ${
        theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-md"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Compass className={`w-5 h-5 animate-spin-slow ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`} />
            <span className={`text-sm font-sans font-black uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              St. Patrick's Venue Maps
            </span>
          </div>
          
          {/* Map Selector Tab Buttons */}
          <div className={`p-1 flex items-center rounded-xl border ${theme === "dark" ? "bg-black/40 border-white/10" : "bg-slate-100 border-slate-205"}`}>
            <button
              onClick={() => setMapMode("blueprint")}
              className={`text-xs px-2.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                mapMode === "blueprint"
                  ? theme === "dark"
                    ? "bg-amber-600/30 text-amber-400 border border-amber-500/30"
                    : "bg-white text-amber-600 shadow-sm border border-slate-200"
                  : "text-gray-400 hover:text-gray-250"
              }`}
            >
              📐 Grounds Blueprint
            </button>
            <button
              onClick={() => setMapMode("live")}
              className={`text-xs px-2.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                mapMode === "live"
                  ? theme === "dark"
                    ? "bg-amber-600/30 text-amber-400 border border-amber-500/30"
                    : "bg-white text-amber-600 shadow-sm border border-slate-200"
                  : "text-gray-400 hover:text-gray-250"
              }`}
            >
              🗺️ Real-Time Google Map
            </button>
          </div>
        </div>

        {/* Dynamic Map Area */}
        {mapMode === "blueprint" ? (
          <div className={`w-full aspect-[4/3] rounded-xl relative border overflow-hidden select-none ${
            theme === "dark" ? "bg-black/60 border-white/5" : "bg-slate-50 border-slate-200"
          }`}>
            {/* Subtle Grid System */}
            <div className={`absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none`} />

            {/* SVG Map Canvas */}
            <svg className="w-full h-full" viewBox="0 0 500 400">
              <defs>
                <radialGradient id="gateGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="neonPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Static Campus Boundaries & Walkways */}
              <path d="M 250 360 L 150 240 L 100 120" stroke={theme === "dark" ? "#1e293b" : "#cbd5e1"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 250 360 L 350 240 L 400 120" stroke={theme === "dark" ? "#1e293b" : "#cbd5e1"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 250 360 L 170 300 L 120 260" stroke={theme === "dark" ? "#1e293b" : "#cbd5e1"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 250 360 L 330 300 L 380 260" stroke={theme === "dark" ? "#1e293b" : "#cbd5e1"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              
              <circle cx="150" cy="240" r="14" fill={theme === "dark" ? "#0f172a" : "#f1f5f9"} stroke={theme === "dark" ? "#334155" : "#94a3b8"} strokeWidth="2" />
              <text x="150" y="243" textAnchor="middle" fill={theme === "dark" ? "#94a3b8" : "#475569"} fontSize="8" fontFamily="monospace">P1</text>
              
              <circle cx="350" cy="240" r="14" fill={theme === "dark" ? "#0f172a" : "#f1f5f9"} stroke={theme === "dark" ? "#334155" : "#94a3b8"} strokeWidth="2" />
              <text x="350" y="243" textAnchor="middle" fill={theme === "dark" ? "#94a3b8" : "#475569"} fontSize="8" fontFamily="monospace">P2</text>

              {/* Glowing Active Path */}
              {showPath && activeVenue.id !== "main-gate" && (
                <path
                  d={activeVenue.pathPoints}
                  stroke="url(#neonPathGradient)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-[dash_2.5s_linear_infinite]"
                  style={{
                    strokeDasharray: "10, 8",
                    filter: "drop-shadow(0px 0px 4px rgba(59, 130, 246, 0.6))",
                  }}
                />
              )}

              {/* Venue Node Circles */}
              {venues.map((v) => {
                const isSelected = selectedVenueId === v.id;
                let markerColor = theme === "dark" ? "fill-[#1e293b] stroke-[#475569]" : "fill-[#f1f5f9] stroke-[#94a3b8]";
                let glowColor = "rgba(59, 130, 246, 0.2)";

                if (v.id === "main-gate") {
                  markerColor = isSelected ? "fill-amber-500 stroke-amber-450" : "fill-amber-600/40 stroke-amber-500/50";
                  glowColor = "rgba(245, 158, 11, 0.3)";
                } else if (isSelected) {
                  markerColor = "fill-amber-500 stroke-amber-400";
                  glowColor = "rgba(245, 158, 11, 0.5)";
                } else {
                  markerColor = theme === "dark" ? "fill-[#1e293b] stroke-[#475569]" : "fill-white stroke-slate-350 stroke-slate-300";
                }

                return (
                  <g key={v.id} className="cursor-pointer group" onClick={() => setSelectedVenueId(v.id)}>
                    {/* Outer Pulsing Glow */}
                    {isSelected && (
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r="18"
                        fill="none"
                        stroke={v.id === "main-gate" ? "#f59e0b" : "#fbbf24"}
                        strokeWidth="2"
                        className="animate-ping"
                        style={{ opacity: 0.2 }}
                      />
                    )}

                    {/* Marker Node Base */}
                    <circle
                      cx={v.x}
                      cy={v.y}
                      r={v.id === "main-gate" ? "8" : "12"}
                      className={`${markerColor} transition-all duration-300 group-hover:scale-125`}
                      style={{ filter: isSelected ? `drop-shadow(0 0 4px ${glowColor})` : "" }}
                    />

                    {/* Icon representations inside SVG */}
                    <circle cx={v.x} cy={v.y} r="4" fill="#020617" opacity="0.3" />

                    {/* Title labels */}
                    <text
                      x={v.x}
                      y={v.y - 18}
                      textAnchor="middle"
                      className={`font-sans font-bold text-[9px] uppercase tracking-wider select-none ${
                        isSelected 
                          ? "fill-amber-500 font-black" 
                          : theme === "dark" 
                            ? "fill-gray-400 group-hover:fill-white" 
                            : "fill-slate-500 group-hover:fill-slate-800"
                      }`}
                    >
                      {v.name.split(" ")[0] || v.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Help HUD overlay */}
            <div className={`absolute bottom-3 left-3 border px-3 py-2 rounded-xl text-[10px] font-mono flex flex-col gap-0.5 ${
              theme === "dark" ? "bg-black/95 border-white/10 text-gray-450" : "bg-white border-slate-205 text-slate-600 shadow-sm"
            }`}>
              <span className={`font-extrabold uppercase ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Parish Campus Guide</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                <span>Selected Arena / Route Tracker</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-1 border-b-2 border-dashed border-gray-400 inline-block" />
                <span>Navigable Walking Corridors</span>
              </div>
            </div>

            {/* Active Guide Button toggler overlay */}
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setShowPath(!showPath)}
                className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  showPath
                    ? theme === "dark"
                      ? "bg-amber-600/30 border-amber-500/40 text-amber-400"
                      : "bg-amber-50 border-amber-200 text-amber-600"
                    : theme === "dark"
                      ? "bg-white/5 border-white/10 text-gray-400"
                      : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                {showPath ? "Hide Path Guideline" : "Show Path Guideline"}
              </button>
            </div>
          </div>
        ) : (
          <div className={`w-full aspect-[4/3] rounded-xl overflow-hidden border relative ${
            theme === "dark" ? "border-white/10" : "border-slate-200 shadow-sm"
          }`}>
            {/* Real-time St. Patrick's Parish, Calabar Google Maps Iframe */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.1643936655193!2d8.347525374465437!3d5.076865238210351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1067858c0c169dfb%3A0x6e2fe6fb601d529a!2sSt%20Patrick's%20Catholic%20Church%20Ikot%20Ansa!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Real-Time Google Map pointing to St. Patrick's Parish, Ikot Ansa, Calabar"
            />
            
            <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] font-mono leading-none flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>LIVE SAT INTERACTIVE VIEW</span>
            </div>
          </div>
        )}

        <div className={`text-[11px] font-mono mt-3 text-center ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
          * Murtala Mohammed Highway, Ikot Ansa, Calabar, Nigeria • Tap venues to compute routes.
        </div>
      </div>

      {/* Sidebar Directions Hub */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-4">
        {/* Active Location Info Card */}
        <div className={`border rounded-2xl p-5 shadow-lg flex-1 relative overflow-hidden backdrop-blur-md ${
          theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-205 text-slate-800 shadow-md"
        }`}>
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/5 rounded-full blur-xl animate-pulse" />
          
          <div className="flex items-start gap-3.5 mb-4 font-sans">
            <div className={`p-3 border rounded-xl flex-shrink-0 ${theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono tracking-widest font-extrabold uppercase leading-none ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                📍 {activeVenue.capacity}
              </span>
              <h4 className={`text-base font-sans font-black leading-snug mt-1 border-b pb-2 ${
                theme === "dark" ? "text-white border-white/10" : "text-slate-900 border-slate-200"
              }`}>
                {activeVenue.name}
              </h4>
            </div>
          </div>

          <p className={`text-xs font-sans leading-relaxed mb-4 ${theme === "dark" ? "text-gray-400" : "text-slate-600 text-justify"}`}>
            {activeVenue.description}
          </p>

          {/* Guide directions List */}
          <div className="mb-4">
            <h5 className={`text-[11px] font-mono font-bold tracking-wider uppercase mb-2.5 flex items-center gap-1 ${
              theme === "dark" ? "text-gray-300" : "text-slate-850 text-slate-705"
            }`}>
              <Navigation className="w-3.5 h-3.5 text-amber-550 text-amber-500" /> Path Guidelines from Entrance
            </h5>
            <ol className="flex flex-col gap-2">
              {activeVenue.directions.map((step, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs leading-normal font-sans text-left">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5 border ${
                    theme === "dark" 
                      ? "bg-white/5 border-white/10 text-amber-405 text-amber-400" 
                      : "bg-slate-150 bg-slate-100 border-slate-200 text-amber-600"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={theme === "dark" ? "text-gray-400" : "text-slate-600"}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Matches Scheduled on Site Card */}
        {activeVenue.sport !== "all" && (
          <div className={`border rounded-2xl p-4 shadow-lg backdrop-blur-md ${
            theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-205 shadow-md text-slate-800"
          }`}>
            <h5 className={`text-xs font-mono font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5 ${
              theme === "dark" ? "text-gray-300" : "text-slate-705"
            }`}>
              <Trophy className="w-4 h-4 text-amber-500" />
              Event Arena Schedule
            </h5>
            {venueMatches.length === 0 ? (
              <div className={`text-xs italic p-4 text-center rounded-xl border ${
                theme === "dark" ? "bg-black/40 border-white/10 text-gray-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                No active matches scheduled on this venue node right now.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 select-none">
                {venueMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between pointer-events-none ${
                      theme === "dark" ? "bg-black/30 border-white/5" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div>
                      <span className={`text-[9px] px-1.5 py-0.5 font-mono font-bold rounded uppercase ${
                        theme === "dark" ? "text-amber-400 bg-amber-500/100 text-black font-black" : "text-amber-800 bg-amber-100"
                      }`}>
                        {match.stage}
                      </span>
                      <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>
                        {match.sport === "athletics" ? (
                          <span>Track Racing Dash</span>
                        ) : (
                          <>
                            <span className="truncate max-w-[80px]">Parish A</span>
                            <span className="text-gray-404 text-[10px]">vs</span>
                            <span className="truncate max-w-[80px]">Parish B</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {match.time}
                      </span>
                      {match.status === "live" ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-600/15 border border-red-500/20 text-red-500 font-mono font-bold rounded mt-1 animate-pulse">
                          LIVE
                        </span>
                      ) : (
                        <span className={`text-[9px] px-1.5 py-0.5 border text-gray-500 font-mono font-bold rounded mt-1 uppercase ${
                          theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 text-slate-500 shadow-sm"
                        }`}>
                          {match.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
