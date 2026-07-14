import React, { useState } from "react";

// Reusable animated SVG Area/Line Chart

export const MiniAreaChart = ({
  data,
  color = "#3b82f6",
  height = 200,
  showGrid = true,
  currency = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0)
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        No Data Available
      </div>
    );

  const maxVal = Math.max(...data.map((d) => d.value)) * 1.15 || 100;
  const padding = 15;
  const numericHeight = typeof height === 'number' ? height : 150;
  const chartHeight = numericHeight - padding * 2;
  const chartWidth = 500;
  const pointsCount = data.length;
  const stepX = chartWidth / (pointsCount - 1 || 1);

  // Generate SVG path coordinates
  const coords = data.map((d, index) => {
    const x = index * stepX;
    const y = chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y };
  });

  let linePath = "";
  let areaPath = "";

  if (coords.length > 0) {
    linePath =
      `M ${coords[0].x} ${coords[0].y} ` +
      coords
        .slice(1)
        .map((c) => `L ${c.x} ${c.y}`)
        .join(" ");
    areaPath = `${linePath} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`;
  }

  const formatShortVal = (val) => {
    if (currency) {
      if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
      return `₹${Math.round(val)}`;
    }
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return Math.round(val).toLocaleString();
  };

  const formatVal = (val) => {
    if (currency) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div
      className="relative w-full flex items-stretch gap-2 pt-2"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      id="mini-area-chart-container"
    >
      {/* Left aligned, non-stretched HTML Y-Axis Labels */}
      <div className="flex flex-col justify-between text-[9px] font-mono font-bold text-slate-400 select-none text-right w-14 shrink-0 pb-6 pt-1">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <span key={i} className="leading-none">
            {formatShortVal(maxVal * (1 - ratio))}
          </span>
        ))}
      </div>

      {/* Main SVG Canvas */}
      <div className="relative flex-1 min-w-0 h-[calc(100%-24px)]">
        <svg
          viewBox={`0 -5 ${chartWidth} ${chartHeight + 10}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartHeight * ratio;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* The Filled Area */}
          <path
            d={areaPath}
            fill={`url(#grad-${color})`}
            className="transition-all duration-500 ease-out"
          />

          {/* The Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Data points */}
          {coords.map((c, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* Tooltip on hover */}
              {hoveredIndex === i && (
                <g className="z-50">
                  <rect
                    x={Math.max(10, Math.min(chartWidth - 130, c.x - 60))}
                    y={Math.max(5, c.y - 45)}
                    width="120"
                    height="32"
                    rx="6"
                    fill="#1e293b"
                    className="shadow-lg animate-scale-up"
                  />
                  <text
                    x={Math.max(70, Math.min(chartWidth - 70, c.x))}
                    y={Math.max(17, c.y - 33)}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {data[i].label}
                  </text>
                  <text
                    x={Math.max(70, Math.min(chartWidth - 70, c.x))}
                    y={Math.max(29, c.y - 21)}
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {formatVal(data[i].value)}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* X Axis Labels rendered as custom absolute layout so they are crisp and aligned */}
        <div className="absolute left-0 right-0 bottom-[-22px] h-5 select-none text-[9px] font-bold text-slate-400">
          {data.map((d, i) => {
            if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1)
              return null;
            const percentage = (i / (data.length - 1 || 1)) * 100;
            return (
              <span
                key={i}
                className="absolute transform -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${percentage}%` }}
              >
                {d.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const PremiumBarChart = ({
  data,
  color1 = "#3b82f6",
  color2 = "#10b981",
  height = 200,
  currency = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0)
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        No Data Available
      </div>
    );

  const maxVal =
    Math.max(...data.map((d) => Math.max(d.value, d.value2 || 0))) * 1.1 || 100;
  const padding = 15;
  const chartHeight = height - padding * 2;
  const chartWidth = 500;
  const barWidth = 12;
  const gap = 4;
  const groupStep = chartWidth / data.length;

  const formatShortVal = (val) => {
    if (currency) {
      if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
      return `₹${Math.round(val)}`;
    }
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return Math.round(val).toLocaleString();
  };

  const formatVal = (val) => {
    if (currency) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div
      className="relative w-full flex items-stretch gap-2 pt-2"
      style={{ height: `${height}px` }}
      id="premium-bar-chart-container"
    >
      {/* Left aligned, non-stretched HTML Y-Axis Labels */}
      <div className="flex flex-col justify-between text-[9px] font-mono font-bold text-slate-400 select-none text-right w-14 shrink-0 pb-6 pt-1">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <span key={i} className="leading-none">
            {formatShortVal(maxVal * (1 - ratio))}
          </span>
        ))}
      </div>

      {/* Main SVG Canvas */}
      <div className="relative flex-1 min-w-0 h-[calc(100%-24px)]">
        <svg
          viewBox={`0 -5 ${chartWidth} ${chartHeight + 10}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight * ratio;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const groupX = i * groupStep + (groupStep - barWidth * 2 - gap) / 2;
            const y1 = chartHeight - (d.value / maxVal) * chartHeight;
            const h1 = (d.value / maxVal) * chartHeight;

            const y2 =
              d.value2 !== undefined
                ? chartHeight - (d.value2 / maxVal) * chartHeight
                : chartHeight;
            const h2 =
              d.value2 !== undefined ? (d.value2 / maxVal) * chartHeight : 0;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Bar 1 */}
                <rect
                  x={groupX}
                  y={y1}
                  width={barWidth}
                  height={Math.max(2, h1)}
                  rx="3"
                  fill={color1}
                  className="transition-all duration-300 hover:brightness-105"
                />

                {/* Bar 2 */}
                {d.value2 !== undefined && (
                  <rect
                    x={groupX + barWidth + gap}
                    y={y2}
                    width={barWidth}
                    height={Math.max(2, h2)}
                    rx="3"
                    fill={color2}
                    className="transition-all duration-300 hover:brightness-105"
                  />
                )}

                {/* Tooltip */}
                {hoveredIndex === i && (
                  <g className="z-50">
                    <rect
                      x={Math.max(10, Math.min(chartWidth - 140, groupX - 50))}
                      y={Math.max(5, Math.min(y1, y2) - 50)}
                      width="130"
                      height="42"
                      rx="6"
                      fill="#1e293b"
                      className="shadow-lg animate-scale-up"
                    />
                    <text
                      x={Math.max(
                        75,
                        Math.min(chartWidth - 75, groupX + barWidth),
                      )}
                      y={Math.max(17, Math.min(y1, y2) - 38)}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>
                    <text
                      x={Math.max(
                        75,
                        Math.min(chartWidth - 75, groupX + barWidth),
                      )}
                      y={Math.max(29, Math.min(y1, y2) - 26)}
                      fill={color1}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      S1: {formatVal(d.value)}
                    </text>
                    {d.value2 !== undefined && (
                      <text
                        x={Math.max(
                          75,
                          Math.min(chartWidth - 75, groupX + barWidth),
                        )}
                        y={Math.max(41, Math.min(y1, y2) - 14)}
                        fill={color2}
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        S2: {formatVal(d.value2)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* X Axis labels rendered as absolute layout elements */}
        <div className="absolute left-0 right-0 bottom-[-22px] h-5 select-none text-[9px] font-bold text-slate-400">
          {data.map((d, i) => {
            const percentage = (i / (data.length - 1 || 1)) * 100;
            return (
              <span
                key={i}
                className="absolute transform -translate-x-1/2 whitespace-nowrap text-center"
                style={{ left: `${percentage}%` }}
              >
                {d.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DonutChart = ({ data, size = 140 }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const strokeWidth = 12;
  const center = size / 2;
  // Calculate dynamic radius to guarantee it always fits completely in the SVG viewbox without clipping
  const radius = (size - strokeWidth - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;

  return (
    <div
      className="flex flex-wrap items-center justify-center sm:justify-start gap-4 w-full min-w-0"
      id="donut-chart-wrapper"
    >
      {/* Chart SVG wrapper with relative sizing */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 overflow-visible"
        >
          {/* Base track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={strokeWidth}
          />

          {/* Segment circles */}
          {data.map((item, index) => {
            const percentage = item.value / total;
            const strokeLength = percentage * circumference;
            const strokeOffset = circumference - currentAngle;
            currentAngle += strokeLength;

            const isHovered = activeIndex === index;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer origin-center"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
          <span className="text-base font-extrabold text-slate-800 font-sans leading-none tracking-tight">
            {activeIndex !== null
              ? data[activeIndex].value.toLocaleString()
              : total.toLocaleString()}
          </span>
          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 truncate max-w-[85px]">
            {activeIndex !== null ? data[activeIndex].label : "Total Items"}
          </span>
        </div>
      </div>

      {/* Side Legend with values and percentages */}
      <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          const isHovered = activeIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                isHovered ? "bg-slate-50" : "hover:bg-slate-50/50"
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-150"
                style={{
                  backgroundColor: item.color,
                  transform: isHovered ? "scale(1.2)" : "none",
                }}
              />

              <div className="flex justify-between items-center w-full min-w-0 gap-2">
                <span className="text-[11px] font-bold text-slate-600 truncate" title={item.label}>
                  {item.label}
                </span>
                <span className="text-[10px] font-mono font-extrabold text-slate-500 shrink-0">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
