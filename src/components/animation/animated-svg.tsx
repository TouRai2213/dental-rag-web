'use client';

import React from 'react';

export function AnimatedSVG({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 600 400"
        className="w-full h-auto max-w-full"
        style={{ minHeight: '400px' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="600" height="400" fill="#f3f4f6" />
        
        {/* Client Box */}
        <g id="client-box">
          <rect x="50" y="50" width="200" height="120" rx="8" fill="white" stroke="#d1d5db" strokeWidth="2"/>
          <rect x="50" y="50" width="200" height="30" rx="8" fill="#1f2937" />
          <text x="150" y="70" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Client</text>
          <circle cx="80" cy="110" r="15" fill="#60a5fa" />
          <text x="80" y="115" textAnchor="middle" fill="white" fontSize="10">👤</text>
          <rect x="110" y="100" width="120" height="8" rx="4" fill="#e5e7eb" />
          <rect x="110" y="115" width="80" height="8" rx="4" fill="#e5e7eb" />
          <rect x="110" y="130" width="100" height="8" rx="4" fill="#e5e7eb" />
        </g>

        {/* Research Library Admin Box */}
        <g id="admin-box">
          <rect x="50" y="230" width="200" height="120" rx="8" fill="white" stroke="#d1d5db" strokeWidth="2"/>
          <rect x="50" y="230" width="200" height="30" rx="8" fill="#1f2937" />
          <text x="150" y="250" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Research Library Admin</text>
          <circle cx="80" cy="290" r="15" fill="#10b981" />
          <text x="80" y="295" textAnchor="middle" fill="white" fontSize="10">👨‍🔬</text>
          <rect x="110" y="280" width="120" height="8" rx="4" fill="#e5e7eb" />
          <rect x="110" y="295" width="80" height="8" rx="4" fill="#e5e7eb" />
          <rect x="110" y="310" width="100" height="8" rx="4" fill="#e5e7eb" />
        </g>

        {/* Dental Brain AI Center */}
        <g id="dental-brain">
          <circle cx="400" cy="200" r="60" fill="#dbeafe" stroke="#3b82f6" strokeWidth="3"/>
          <circle cx="385" cy="200" r="45" fill="#60a5fa" opacity="0.8"/>
          
          {/* Tooth Icon */}
          <path d="M370 185 Q370 175 375 175 Q380 175 380 185 L380 210 Q380 215 375 215 Q370 215 370 210 Z" fill="white"/>
          <path d="M370 185 Q370 180 372 180 Q374 180 375 182" fill="none" stroke="#1f2937" strokeWidth="1"/>
          
          {/* Brain Icon (simplified) */}
          <ellipse cx="410" cy="200" rx="25" ry="30" fill="#ec4899" opacity="0.7"/>
          <path d="M395 190 Q400 185 405 190" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M395 200 Q400 195 405 200" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M395 210 Q400 205 405 210" fill="none" stroke="white" strokeWidth="2"/>
          
          <text x="400" y="270" textAnchor="middle" fill="#1f2937" fontSize="18" fontWeight="bold">Dental Brain AI</text>
        </g>

        {/* Animated Connections */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <polygon points="0 0, 10 5, 0 10" fill="#60a5fa" />
          </marker>
        </defs>

        {/* Connection from Client to Dental Brain */}
        <line x1="250" y1="110" x2="340" y2="180" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)">
          <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite"/>
        </line>

        {/* Connection from Admin to Dental Brain */}
        <line x1="250" y1="290" x2="340" y2="220" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)">
          <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite"/>
        </line>

        {/* Pulsing effect for Dental Brain */}
        <circle cx="400" cy="200" r="60" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0">
          <animate attributeName="r" from="60" to="80" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>

        {/* Data flow particles */}
        <circle r="3" fill="#60a5fa">
          <animateMotion dur="3s" repeatCount="indefinite">
            <mpath href="#path1"/>
          </animateMotion>
        </circle>
        
        <circle r="3" fill="#10b981">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
            <mpath href="#path2"/>
          </animateMotion>
        </circle>

        {/* Define paths for particles */}
        <path id="path1" d="M250,110 Q300,140 340,180" fill="none"/>
        <path id="path2" d="M250,290 Q300,260 340,220" fill="none"/>
      </svg>
    </div>
  );
}

export default AnimatedSVG;