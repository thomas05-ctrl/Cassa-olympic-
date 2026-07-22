import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface MedalStandingsChartProps {
  data: Array<{
    id: string;
    name: string;
    golds: number;
    silvers: number;
    bronzes: number;
    overallPoints: number;
    logoColor?: string;
  }>;
  theme: "light" | "dark";
}

export default function MedalStandingsChart({ data, theme }: MedalStandingsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`p-8 text-center text-xs italic rounded-xl border border-dashed border-current/15 ${
        theme === "dark" ? "text-zinc-550 bg-zinc-950/20" : "text-slate-450 bg-slate-50/50"
      }`}>
        No registered competing parishes or Olympic standings tallies to show. Please enroll parishes from the Console to populate the D3 medal chart!
      </div>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    parishName: string;
    golds: number;
    silvers: number;
    bronzes: number;
    points: number;
  } | null>(null);

  // ResizeObserver to make the D3 visualization responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Set width based on container width or fallback
        const w = Math.max(320, entry.contentRect.width);
        setWidth(w);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // D3 Render effect
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous details
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Setup Dimensions
    const margin = { top: 20, right: 80, bottom: 30, left: 160 };
    const barHeight = 44;
    const height = data.length * barHeight + margin.top + margin.bottom;

    svg.attr("width", width).attr("height", height);

    // Calculate maximum value to determine range
    // Sum the medals for stacked presentation max, or use a minimum domain
    const maxMedalsVal = d3.max(data, d => d.golds + d.silvers + d.bronzes) || 0;
    const xMax = Math.max(10, maxMedalsVal + 2); // padding so the total label fits beautifully

    // Scales
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.35);

    const xScale = d3.scaleLinear()
      .domain([0, xMax])
      .range([margin.left, width - margin.right]);

    // Grid lines for background
    const gridTicks = xScale.ticks(5);
    const gridColor = theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    
    // Draw background tracks for each parish
    svg.append("g")
      .selectAll("rect.track")
      .data(data)
      .join("rect")
      .attr("class", "track")
      .attr("x", margin.left)
      .attr("y", d => yScale(d.name) || 0)
      .attr("width", width - margin.left - margin.right)
      .attr("height", yScale.bandwidth())
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", theme === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)")
      .attr("stroke", theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)")
      .attr("stroke-width", 1);

    // Grid System Lines
    svg.append("g")
      .selectAll("line.grid")
      .data(gridTicks)
      .join("line")
      .attr("class", "grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", gridColor)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    // Grid Labels (ticks description)
    svg.append("g")
      .selectAll("text.tick-label")
      .data(gridTicks)
      .join("text")
      .attr("class", "tick-label")
      .attr("x", d => xScale(d))
      .attr("y", height - margin.bottom + 15)
      .attr("text-anchor", "middle")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-size", "9px")
      .attr("fill", theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)")
      .text(d => `${d}🏅`);

    // Draw stacked bars manually for complete styling and hover precision
    data.forEach((parish, rowIdx) => {
      const y = yScale(parish.name) || 0;
      const h = yScale.bandwidth();
      
      const totalMedals = parish.golds + parish.silvers + parish.bronzes;
      
      // Values to stack
      const stacks = [
        { type: "gold", val: parish.golds, color: "url(#gold-gradient)", start: 0 },
        { type: "silver", val: parish.silvers, color: "url(#silver-gradient)", start: parish.golds },
        { type: "bronze", val: parish.bronzes, color: "url(#bronze-gradient)", start: parish.golds + parish.silvers }
      ];

      // Draw the segments for this row
      stacks.forEach((stack) => {
        if (stack.val === 0) return;

        const xStart = xScale(stack.start);
        const xEnd = xScale(stack.start + stack.val);
        const barWidth = xEnd - xStart;

        const barRect = svg.append("rect")
          .attr("x", xStart)
          .attr("y", y)
          .attr("width", 0) // initialize at 0 for transition
          .attr("height", h)
          .attr("fill", stack.color)
          .attr("rx", 3)
          .attr("ry", 3)
          .attr("cursor", "pointer")
          .attr("stroke", theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)")
          .attr("stroke-width", 1);

        // Transition implementation
        barRect.transition()
          .duration(800)
          .delay(rowIdx * 50)
          .attr("width", barWidth);

        // Hover events connected to state-based tooltip
        barRect.on("mouseover", (event) => {
          d3.select(event.currentTarget)
            .attr("stroke", theme === "dark" ? "#e0a82e" : "#d97706")
            .attr("stroke-width", 2);
          
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            visible: true,
            parishName: parish.name,
            golds: parish.golds,
            silvers: parish.silvers,
            bronzes: parish.bronzes,
            points: parish.overallPoints
          });
        })
        .on("mousemove", (event) => {
          setTooltip(prev => prev ? {
            ...prev,
            x: event.clientX,
            y: event.clientY
          } : null);
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget)
            .attr("stroke", theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)")
            .attr("stroke-width", 1);
          setTooltip(null);
        });
      });

      // Total Medals Text Count Label at the end of the bar stack
      const barStackEnd = xScale(totalMedals);
      const labelText = svg.append("text")
        .attr("x", barStackEnd + 8)
        .attr("y", y + h / 2 + 4)
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("fill", theme === "dark" ? "#f59e0b" : "#b45309")
        .text(`${parish.overallPoints} pts`);

      // Add fade in
      labelText.style("opacity", 0)
        .transition()
        .delay(400 + rowIdx * 50)
        .duration(400)
        .style("opacity", 1);
    });

    // Draw Y-Axis labels (Parish Names) perfectly formatted and aligned on the left
    const yAxisGroup = svg.append("g")
      .attr("class", "y-axis");

    yAxisGroup.selectAll("text.parish-label")
      .data(data)
      .join("text")
      .attr("class", "parish-label")
      .attr("x", margin.left - 15)
      .attr("y", d => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "end")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "800")
      .attr("font-size", width < 480 ? "10px" : "11px")
      .attr("fill", theme === "dark" ? "#f3f4f6" : "#0f172a")
      .text(d => {
        // truncate parish name for narrow viewports
        if (width < 450 && d.name.length > 15) {
          return d.name.substring(0, 14) + "...";
        }
        return d.name;
      })
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("fill", "#fbbf24");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("fill", theme === "dark" ? "#f3f4f6" : "#0f172a");
      });

    // Draw Small Parish Color Dots on the Y-Axis as decorative bullets
    yAxisGroup.selectAll("circle.parish-dot")
      .data(data)
      .join("circle")
      .attr("class", "parish-dot")
      .attr("cx", margin.left - 8)
      .attr("cy", d => (yScale(d.name) || 0) + yScale.bandwidth() / 2)
      .attr("r", 3.5)
      .attr("fill", d => {
        // Map common tailwind bg classes to clean hex colors
        if (d.logoColor?.includes("emerald")) return "#10b981";
        if (d.logoColor?.includes("sky")) return "#0ea5e9";
        if (d.logoColor?.includes("amber")) return "#f59e0b";
        if (d.logoColor?.includes("purple")) return "#a855f7";
        if (d.logoColor?.includes("red")) return "#ef4444";
        if (d.logoColor?.includes("orange")) return "#f97316";
        if (d.logoColor?.includes("pink")) return "#ec4899";
        if (d.logoColor?.includes("indigo")) return "#4f46e5";
        return "#64748b";
      });

  }, [data, theme, width]);

  return (
    <div ref={containerRef} className="w-full relative select-none">
      
      {/* Dynamic gradients defined once inside SVG defs */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="bronze-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
      </svg>

      <div className={`overflow-x-auto overflow-y-hidden rounded-xl p-4 transition-all ${
        theme === "dark" ? "bg-black/20" : "bg-slate-50/50"
      }`}>
        <svg ref={svgRef} className="mx-auto block" />
      </div>

      {/* Floating interactive HTML tooltip */}
      {tooltip && tooltip.visible && (
        <div
          className={`absolute pointer-events-none p-3.5 rounded-xl shadow-2xl border text-xs flex flex-col gap-1.5 transition-all duration-75 z-50 backdrop-blur-md ${
            theme === "dark" 
              ? "bg-[#141517]/95 border-amber-500/30 text-white min-w-[200px]" 
              : "bg-white/95 border-amber-200 text-slate-900 min-w-[200px]"
          }`}
          style={{
            left: `${Math.min(width - 210, Math.max(10, tooltip.x - (containerRef.current?.getBoundingClientRect().left || 0) + 15))}px`,
            top: `${tooltip.y - (containerRef.current?.getBoundingClientRect().top || 0) - 100}px`
          }}
        >
          <p className="font-sans font-black uppercase text-[11px] border-b border-white/5 pb-1 flex items-center gap-1">
            ⛪ {tooltip.parishName}
          </p>
          <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
            <div className="bg-amber-500/10 rounded-lg p-1">
              <p className="text-[10px] text-yellow-500">🏆</p>
              <p className="font-extrabold text-xs text-yellow-400">{tooltip.golds}</p>
              <p className="text-[8px] text-gray-400 font-sans uppercase">Gold</p>
            </div>
            <div className="bg-slate-500/10 rounded-lg p-1">
              <p className="text-[10px] text-gray-300">🥈</p>
              <p className="font-extrabold text-xs text-slate-300">{tooltip.silvers}</p>
              <p className="text-[8px] text-gray-400 font-sans uppercase">Silver</p>
            </div>
            <div className="bg-amber-850/10 rounded-lg p-1">
              <p className="text-[10px] text-amber-700">🥉</p>
              <p className="font-extrabold text-xs text-amber-500">{tooltip.bronzes}</p>
              <p className="text-[8px] text-gray-400 font-sans uppercase">Bronze</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-white/5 font-mono">
            <span className="text-[10px] text-gray-400">Olympic Score:</span>
            <span className="text-[11px] font-black text-amber-500">{tooltip.points} points</span>
          </div>
        </div>
      )}
    </div>
  );
}
