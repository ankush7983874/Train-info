import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Generate a random math equation captcha
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 15) + 1;
  const isAddition = Math.random() > 0.3;

  const question = isAddition ? `${num1} + ${num2}` : `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
  const answer = isAddition ? num1 + num2 : Math.max(num1, num2) - Math.min(num1, num2);

  // Generate lightweight SVG for Captcha
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="40" viewBox="0 0 140 40">
    <rect width="100%" height="100%" fill="#F3F4F6" rx="8"/>
    <path d="M10 20 Q 35 5, 60 20 T 130 20" stroke="#E5E7EB" stroke-width="2" fill="none"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace, sans-serif" font-size="18" font-weight="bold" fill="#1E40AF">
      ${question} = ?
    </text>
  </svg>`;

  const timestamp = Date.now();
  const tokenPayload = `${answer}:${timestamp}`;
  const captchaToken = Buffer.from(tokenPayload).toString('base64');

  return NextResponse.json({
    captchaToken,
    question: `${question} = ?`,
    captchaSvg: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  });
}
