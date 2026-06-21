'use client';

import { useState } from 'react';

type TrendChartProps = {
  history: Feedback[];
};

export default function TrendChart({ history }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className='flex items-center justify-center h-48 text-gray-400 text-sm bg-white/5 border border-white/5 rounded-2xl p-4'>
        No statistics available yet. Take a checkup to generate trends!
      </div>
    );
  }

  // Dimensions
  const width = 500;
  const height = 200;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 40;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Map data to points
  const points = history.map((item, index) => {
    const x =
      history.length > 1
        ? paddingLeft + (index / (history.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const y = height - paddingBottom - (item.totalScore / 100) * chartHeight;
    return { x, y, score: item.totalScore, date: item.createdAt, data: item };
  });

  // Build SVG Path for the line and area fill
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    areaPath = `M ${points[0].x} ${height - paddingBottom}`;

    for (let i = 0; i < points.length; i++) {
      if (i > 0) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
      }
      areaPath += ` L ${points[i].x} ${points[i].y}`;
    }

    areaPath += ` L ${points[points.length - 1].x} ${height - paddingBottom} Z`;
  }

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className='relative w-full bg-white/5 border border-white/5 rounded-2xl p-4 shadow-inner'>
      <div className='flex items-center justify-between mb-4'>
        <span className='text-xs font-bold uppercase tracking-wider text-gray-400'>Score Progress Trend</span>
        <span className='text-[10px] bg-primary-200/20 text-primary-200 px-2 py-0.5 rounded-full font-semibold'>Total Scores (0-100)</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className='w-full overflow-visible'>
        <defs>
          {/* Neon Glow Filter */}
          <filter id='glow' x='-20%' y='-20%' width='140%' height='140%'>
            <feGaussianBlur stdDeviation='3' result='blur' />
            <feComposite in='SourceGraphic' in2='blur' operator='over' />
          </filter>
          {/* Gradient for Area Fill */}
          <linearGradient id='areaGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#cac5fe' stopOpacity='0.25' />
            <stop offset='100%' stopColor='#cac5fe' stopOpacity='0.0' />
          </linearGradient>
        </defs>

        {/* Grid lines & Y Axis labels */}
        {yTicks.map((tick) => {
          const y = height - paddingBottom - (tick / 100) * chartHeight;
          return (
            <g key={tick} className='opacity-30'>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke='white'
                strokeWidth='1'
                strokeDasharray='4 4'
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                fill='white'
                fontSize='9'
                textAnchor='end'
                className='font-semibold font-mono'
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaPath} fill='url(#areaGradient)' />
        )}

        {/* Trend Line */}
        {points.length > 1 ? (
          <path
            d={linePath}
            fill='none'
            stroke='#cac5fe'
            strokeWidth='2.5'
            filter='url(#glow)'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        ) : (
          points.length === 1 && (
            <circle
              cx={points[0].x}
              cy={points[0].y}
              r='5'
              fill='#cac5fe'
              filter='url(#glow)'
            />
          )
        )}

        {/* Points & Interactive Tooltip Triggers */}
        {points.map((p, idx) => (
          <g key={idx}>
            {/* Larger transparent hover target circle */}
            <circle
              cx={p.x}
              cy={p.y}
              r='12'
              fill='transparent'
              className='cursor-pointer'
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Outer ring */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? '6' : '4.5'}
              fill='black'
              stroke='#cac5fe'
              strokeWidth='2'
              className='pointer-events-none transition-all duration-200'
            />
            {/* Inner dot */}
            {hoveredIndex === idx && (
              <circle
                cx={p.x}
                cy={p.y}
                r='2.5'
                fill='#cac5fe'
                className='pointer-events-none'
              />
            )}
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // Only show labels for first, middle, and last to avoid text overlaps
          const shouldShowLabel =
            points.length <= 4 ||
            idx === 0 ||
            idx === points.length - 1 ||
            (points.length > 4 && idx === Math.floor(points.length / 2));

          if (!shouldShowLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={height - paddingBottom + 16}
              fill='white'
              fontSize='9'
              textAnchor='middle'
              className='opacity-60 font-semibold font-mono'
            >
              {new Date(p.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          );
        })}
      </svg>

      {/* Floating HTML Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className='absolute z-10 backdrop-blur-md bg-black/95 border border-white/10 p-3 rounded-xl shadow-xl text-left pointer-events-none max-w-[200px] space-y-1.5'
          style={{
            left: `${Math.min(
              Math.max(10, (points[hoveredIndex].x / width) * 100 - 20),
              75
            )}%`,
            bottom: '70px',
          }}
        >
          <div className='border-b border-white/10 pb-1 flex justify-between items-center gap-4'>
            <span className='text-[10px] text-gray-400 font-semibold font-mono'>
              {new Date(points[hoveredIndex].date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className='text-xs font-bold text-primary-200 font-mono'>
              Score: {points[hoveredIndex].score}
            </span>
          </div>
          {points[hoveredIndex].data.categoryScores && (
            <div className='space-y-1 text-[9px] text-gray-300'>
              {points[hoveredIndex].data.categoryScores.slice(0, 3).map((cat: any) => (
                <div key={cat.name} className='flex justify-between gap-2'>
                  <span className='truncate'>{cat.name}</span>
                  <span className='font-bold'>{cat.score}</span>
                </div>
              ))}
              {points[hoveredIndex].data.categoryScores.length > 3 && (
                <div className='text-[8px] text-gray-500 italic text-center pt-0.5'>
                  + {points[hoveredIndex].data.categoryScores.length - 3} more categories
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
