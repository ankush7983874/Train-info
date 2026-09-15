'use client';

import React, { useState } from 'react';
import { JourneyContext } from '@/types/ai';
import { Share2, Copy, Check, ShieldCheck, ExternalLink, X } from 'lucide-react';

interface ShareJourneyModalProps {
  context: JourneyContext;
}

export default function ShareJourneyModal({ context }: ShareJourneyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!context || !context.trainNumber) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${context.trainNumber}`
    : `https://railradar.app/share/${context.trainNumber}`;

  const shareText = `🚂 Tracking Train ${context.trainName} (#${context.trainNumber}) on RailRadar
📍 Current Station: ${context.currentStation?.name || 'En Route'}
➡️ Next Station: ${context.nextStation?.name || 'Destination'}
⏱️ Status: ${context.delayText}
📊 Progress: ${context.journeyProgressPercent}% completed
🔗 Live Map: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-100 shadow-2xs transition-all"
      >
        <Share2 className="h-4 w-4" />
        <span>Share Live Journey</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Share Safe Live Journey</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-green-50 p-3 border border-green-200 text-xs font-medium text-green-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
              <span>Privacy Verified: No passenger names, full PNR, or private tokens are shared.</span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2 text-xs font-semibold text-gray-700">
              <div className="text-sm font-extrabold text-gray-900">
                {context.trainName} (#{context.trainNumber})
              </div>
              <div>Current: {context.currentStation?.name || 'N/A'}</div>
              <div>Next: {context.nextStation?.name || 'N/A'}</div>
              <div>Status: {context.delayText}</div>
              <div>Progress: {context.journeyProgressPercent}%</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-all"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied Live Journey Summary!' : 'Copy Shareable Summary'}
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3 text-xs font-extrabold text-gray-700 hover:bg-gray-200 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Open Public Shareable View
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
