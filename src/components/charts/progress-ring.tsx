"use client";

import React from 'react';

interface ProgressRingProps {
  title: string;
  percentage: number; // 0 to 100
  color?: string;
  subtitle?: string;
  className?: string;
}

export function ProgressRing({ 
  title, 
  percentage, 
  color = '#4f46e5', 
  subtitle,
  className = '' 
}: ProgressRingProps) {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center ${className}`}>
      <h3 className="text-slate-700 font-heading font-bold mb-6 w-full text-left">{title}</h3>
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background Ring */}
          <circle
            stroke="#f1f5f9"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress Ring */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{Math.round(percentage)}%</span>
        </div>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-4 text-center">{subtitle}</p>}
    </div>
  );
}
