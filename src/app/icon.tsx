import { NextResponse } from 'next/server';

// Return a static SVG icon to avoid dynamic generation issues
export default function Icon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect fill="#4285F4" width="32" height="32" rx="4"/>
      <text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="Arial">TL</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
}