import React from "react";

/**
 * Playful, retro food & process sticker illustrations
 * matching The Pancake Club's vintage brand vibe.
 */

export function OrderOnlineSticker() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="68"
      height="68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="step-svg-art"
    >
      {/* Glow / Backdrop Circle */}
      <circle cx="50" cy="50" r="44" fill="#fef3c7" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6 4" />

      {/* Retro Smartphone */}
      <rect x="30" y="16" width="40" height="68" rx="10" fill="#2d1a12" stroke="#f59e0b" strokeWidth="2.5" />
      <rect x="34" y="24" width="32" height="48" rx="5" fill="#fffbeb" />

      {/* Phone Camera Notch & Home Bar */}
      <circle cx="50" cy="20" r="2" fill="#f59e0b" />
      <rect x="42" y="76" width="16" height="3" rx="1.5" fill="#f59e0b" />

      {/* Mini Pancake Stack on Screen */}
      <ellipse cx="50" cy="52" rx="11" ry="3.5" fill="#f59e0b" stroke="#2d1a12" strokeWidth="1.2" />
      <ellipse cx="50" cy="48" rx="10" ry="3" fill="#fbbf24" stroke="#2d1a12" strokeWidth="1.2" />
      <ellipse cx="50" cy="44" rx="9" ry="2.8" fill="#fde68a" stroke="#2d1a12" strokeWidth="1.2" />
      {/* Butter cube */}
      <rect x="48" y="38" width="4" height="4" rx="1" fill="#f59e0b" stroke="#2d1a12" strokeWidth="1" />

      {/* Finger Tap cursor / touch indicator */}
      <g transform="translate(54, 52)">
        <circle cx="10" cy="10" r="8" fill="#f43f5e" opacity="0.2" />
        <circle cx="10" cy="10" r="4" fill="#f43f5e" />
        <path d="M10 2 C12 2, 14 4, 14 7 L14 14 L17 14 C19 14, 20 16, 19 18 L16 24 C15 25.5, 13 26.5, 11 26.5 L6 26.5 C4 26.5, 2.5 25, 2.5 23 L2.5 16 C2.5 14.5, 4 13.5, 5.5 14.5 L7.5 16 L7.5 7 C7.5 4, 9 2, 10 2 Z" fill="#ffffff" stroke="#2d1a12" strokeWidth="1.6" strokeLinejoin="round" />
      </g>

      {/* Sparkles */}
      <path d="M18 24 L20 18 L22 24 L28 26 L22 28 L20 34 L18 28 L12 26 Z" fill="#f59e0b" />
      <circle cx="78" cy="22" r="2.5" fill="#f43f5e" />
      <circle cx="22" cy="74" r="3" fill="#fbbf24" />
    </svg>
  );
}

export function GriddleFreshSticker() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="68"
      height="68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="step-svg-art"
    >
      {/* Glow / Backdrop Circle */}
      <circle cx="50" cy="50" r="44" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" />

      {/* Hot Sizzling Griddle Pan */}
      <ellipse cx="50" cy="62" rx="36" ry="15" fill="#2d1a12" stroke="#2d1a12" strokeWidth="2" />
      <ellipse cx="50" cy="60" rx="33" ry="12" fill="#442619" />

      {/* Pan Handle */}
      <path d="M16 62 L4 66 C2 67, 1 69, 2 71 L3 73 C4 75, 7 75, 9 74 L18 67 Z" fill="#2d1a12" />

      {/* Fresh Golden Pancake Bubbling in Pan */}
      <ellipse cx="48" cy="58" rx="20" ry="7.5" fill="#f59e0b" stroke="#2d1a12" strokeWidth="1.8" />
      <ellipse cx="48" cy="56" rx="18" ry="6.5" fill="#fbbf24" />
      {/* Butter pat melting with dripping syrup */}
      <rect x="45" y="52" width="6" height="5" rx="1.5" fill="#fde68a" stroke="#2d1a12" strokeWidth="1.2" transform="rotate(-6 48 54)" />
      <path d="M47 57 Q49 61 51 57" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />

      {/* Wooden Spatula Flipping */}
      <g transform="translate(48, 18) rotate(22)">
        <rect x="18" y="2" width="5" height="26" rx="2.5" fill="#92400e" stroke="#2d1a12" strokeWidth="1.4" />
        <path d="M12 28 L29 28 L27 42 C27 44, 25 45, 23 45 L18 45 C16 45, 14 44, 14 42 Z" fill="#d97706" stroke="#2d1a12" strokeWidth="1.5" />
        {/* Slots in spatula */}
        <line x1="17" y1="32" x2="17" y2="40" stroke="#2d1a12" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="21" y1="32" x2="21" y2="40" stroke="#2d1a12" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24" y1="32" x2="24" y2="40" stroke="#2d1a12" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Sizzle / Steam Waves */}
      <path d="M34 44 C32 38, 36 34, 33 28" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M48 38 C46 32, 50 28, 47 22" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 42 C60 36, 64 32, 61 26" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />

      {/* Sizzle Stars */}
      <circle cx="26" cy="46" r="2.5" fill="#f59e0b" />
      <circle cx="76" cy="48" r="3" fill="#f59e0b" />
    </svg>
  );
}

export function PickUpHotSticker() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="68"
      height="68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="step-svg-art"
    >
      {/* Glow / Backdrop Circle */}
      <circle cx="50" cy="50" r="44" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="6 4" />

      {/* Kraft Takeaway Bag / Box */}
      <path d="M26 42 L30 82 C30.5 85, 33 87, 36 87 L64 87 C67 87, 69.5 85, 70 82 L74 42 Z" fill="#d97706" stroke="#2d1a12" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M26 42 L74 42 L71 36 L29 36 Z" fill="#b45309" stroke="#2d1a12" strokeWidth="2" strokeLinejoin="round" />

      {/* Bag Twisted Handles */}
      <path d="M40 36 C40 22, 60 22, 60 36" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Cute Pancake Club Badge on Bag */}
      <circle cx="50" cy="62" r="14" fill="#fef3c7" stroke="#2d1a12" strokeWidth="1.6" />
      {/* Mini smiley pancake inside badge */}
      <ellipse cx="50" cy="62" rx="9" ry="3.5" fill="#f59e0b" />
      <circle cx="47" cy="60.5" r="1" fill="#2d1a12" />
      <circle cx="53" cy="60.5" r="1" fill="#2d1a12" />
      <path d="M48 63.5 Q50 65.5 52 63.5" stroke="#2d1a12" strokeWidth="1" strokeLinecap="round" fill="none" />

      {/* Hot Steam Puffs */}
      <path d="M38 28 C35 22, 40 18, 37 12" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M50 22 C47 16, 52 12, 49 6" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 26 C59 20, 64 16, 61 10" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />

      {/* Ready Heart / Sparkle */}
      <path d="M76 28 L78 22 L80 28 L86 30 L80 32 L78 38 L76 32 L70 30 Z" fill="#ec4899" />
      <circle cx="22" cy="38" r="3" fill="#f59e0b" />
      <circle cx="80" cy="74" r="3.5" fill="#8b5cf6" />
    </svg>
  );
}
