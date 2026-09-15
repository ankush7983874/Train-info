'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Ticket, RefreshCw, Loader2, CheckCircle2, AlertCircle, ArrowRight, Trash2, Calendar, UserCheck, ShieldCheck, MapPin, Users, Armchair, Info } from 'lucide-react';
import { PnrStatus, Passenger } from '@/types/pnr';
import { useJourneyStore } from '@/store/journeyStore';
import { useFavoritesStore } from '@/store/favoritesStore';

export default function PnrPage() {
  const [pnrInput, setPnrInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaData, setCaptchaData] = useState<{ captchaToken: string; question: string; captchaSvg: string } | null>(null);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<PnrStatus | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);

  const { journeys, addOrUpdateJourney, removeJourney } = useJourneyStore();
  const { setSelectedTrainNumber } = useFavoritesStore();

  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/pnr/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaData(data);
        setCaptchaInput('');
      }
    } catch {
      setErrorMsg('Failed to load CAPTCHA image.');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPnr = pnrInput.trim().replace(/\s+/g, '');
    setErrorMsg(null);
    setInfoMsg(null);

    if (!/^\d{10}$/.test(cleanPnr)) {
      setErrorMsg('Invalid PNR number. Please enter a valid 10-digit PNR number.');
      return;
    }

    if (!captchaInput.trim() || !captchaData) {
      setErrorMsg('Please enter the CAPTCHA answer.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/pnr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pnr: cleanPnr,
          captchaAnswer: captchaInput.trim(),
          captchaToken: captchaData.captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to verify PNR.');
        fetchCaptcha();
      } else {
        setCurrentResult(data);
        addOrUpdateJourney(data);
        setSelectedTrainNumber(data.trainNumber);
        setInfoMsg(`Successfully updated latest status for PNR: ${cleanPnr}`);
        fetchCaptcha(); // Refresh CAPTCHA for future verification
      }
    } catch {
      setErrorMsg('Network error during PNR verification. Please try again.');
      fetchCaptcha();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTriggerRefreshPnr = (targetPnr: string) => {
    setPnrInput(targetPnr);
    setErrorMsg(null);
    setInfoMsg(`Answer security CAPTCHA below to fetch latest provider status for PNR: ${targetPnr}`);
    fetchCaptcha();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      captchaInputRef.current?.focus();
    }, 300);
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s.includes('CNF') || s.includes('CONFIRM')) {
      return <span className="rounded-lg bg-green-100 px-2.5 py-0.5 text-xs font-extrabold text-green-700">CNF / CONFIRMED</span>;
    }
    if (s.includes('RAC')) {
      return <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">{s}</span>;
    }
    if (s.includes('WL') || s.includes('WAIT')) {
      return <span className="rounded-lg bg-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-orange-800">{s}</span>;
    }
    return <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-extrabold text-gray-700">{s}</span>;
  };

  const hasUnallottedPassenger = currentResult?.passengers.some((p) => !p.coach || !p.berth);

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs">
          <Ticket className="h-4 w-4" />
          <span>Authoritative Indian Railways PNR Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          Check PNR Status & Add to My Journeys
        </h1>
        <p className="text-sm text-gray-500 font-medium max-w-xl mx-auto">
          Verify 10-digit PNR status with real CAPTCHA security. Automatically connect your PNR to live train tracking and map updates.
        </p>
      </div>

      {/* PNR Search Card */}
      <div ref={formRef} className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50 backdrop-blur-xl">
        <form onSubmit={handleVerify} className="space-y-6">
          {/* PNR Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              10-Digit PNR Number
            </label>
            <div className="relative flex items-center">
              <Ticket className="absolute left-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                maxLength={10}
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit PNR number (e.g. 2414163000)..."
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 outline-none text-base font-bold tracking-wider focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {/* CAPTCHA Input Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Security CAPTCHA
              </label>
              <div className="flex items-center gap-2 pt-1">
                {isLoadingCaptcha ? (
                  <div className="flex h-10 w-36 items-center justify-center rounded-xl bg-gray-200 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                ) : captchaData ? (
                  <div
                    className="h-10 w-36 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: decodeURIComponent(captchaData.captchaSvg.replace('data:image/svg+xml;utf8,', '')) }}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={fetchCaptcha}
                  title="Refresh CAPTCHA"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-2xs"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Answer CAPTCHA
              </label>
              <input
                ref={captchaInputRef}
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter result..."
                className="w-full rounded-xl border border-gray-200 py-2.5 px-3.5 text-gray-900 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
              />
            </div>
          </div>

          {/* Info Banner */}
          {infoMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-xs font-semibold text-blue-800 border border-blue-200">
              <Info className="h-4 w-4 shrink-0 text-blue-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying || pnrInput.length !== 10}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying PNR Record...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Verify PNR & Connect Journey
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verified Result Display */}
      {currentResult && (
        <div className="rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">
                  PNR: {currentResult.pnr}
                </span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mt-2">
                {currentResult.trainName} (#{currentResult.trainNumber})
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleTriggerRefreshPnr(currentResult.pnr)}
                className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh PNR Status</span>
              </button>

              <Link
                href={`/train/${currentResult.trainNumber}`}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all"
              >
                Track Live Train Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-gray-400 block font-semibold">Journey Date</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                {currentResult.journeyDate}
              </span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-gray-400 block font-semibold">Class & Quota</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                {currentResult.class} | {currentResult.quota}
              </span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-gray-400 block font-semibold">Booking Status</span>
              <span className="text-sm font-bold text-green-600 mt-0.5 block">
                {currentResult.bookingStatus}
              </span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-gray-400 block font-semibold">Chart Status</span>
              <span className="text-sm font-bold text-indigo-600 mt-0.5 block">
                {currentResult.chartStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{currentResult.source.name} ({currentResult.source.code}) → {currentResult.destination.name} ({currentResult.destination.code})</span>
          </div>

          {/* Passenger Details Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                PASSENGER DETAILS ({currentResult.passengers.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentResult.passengers.map((p: Passenger, idx: number) => {
                const hasCoach = Boolean(p.coach && p.coach.trim() !== '');
                const hasBerth = Boolean(p.berth && p.berth.trim() !== '');

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                        <Armchair className="h-4 w-4 text-blue-600" />
                        Passenger {p.number || idx + 1}
                      </span>
                      {getStatusBadge(p.currentStatus || p.bookingStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 block uppercase">Coach</span>
                        <span className={`text-sm font-extrabold mt-0.5 block ${hasCoach ? 'text-blue-700' : 'text-gray-500 font-semibold'}`}>
                          {hasCoach ? p.coach : 'Not allotted yet'}
                        </span>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 block uppercase">Berth / Seat</span>
                        <span className={`text-sm font-extrabold mt-0.5 block ${hasBerth ? 'text-indigo-700' : 'text-gray-500 font-semibold'}`}>
                          {hasBerth ? `${p.berth}${p.berthType ? ` (${p.berthType})` : ''}` : 'Not allotted yet'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-gray-500 flex items-center justify-between pt-1">
                      <span>Booking: <strong className="text-gray-700">{p.bookingStatus}</strong></span>
                      <span>Current: <strong className="text-gray-700">{p.currentStatus}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasUnallottedPassenger && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 text-xs font-semibold text-blue-800 border border-blue-100 mt-2">
                <Info className="h-4 w-4 shrink-0 text-blue-600" />
                <span>Coach/berth details are not available in the current PNR response (typically allotted upon Chart Preparation by Indian Railways).</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Journeys: Active vs Completed History */}
      <div className="space-y-6 pt-4">
        {/* Active Journeys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Active Journeys ({journeys.filter(j => j.status.journeyState !== 'COMPLETED').length})
            </h2>
          </div>

          {journeys.filter(j => j.status.journeyState !== 'COMPLETED').length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 space-y-2">
              <Ticket className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">No active verified journeys saved yet.</p>
              <p className="text-xs text-gray-400">Enter a 10-digit PNR number above to automatically save your journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {journeys.filter(j => j.status.journeyState !== 'COMPLETED').map((item) => (
                <div
                  key={item.pnr}
                  className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/40 hover:shadow-xl transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        PNR: {item.pnr}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1">{item.status.trainName}</h3>
                      <p className="text-xs text-gray-500 font-medium">#{item.status.trainNumber} • {item.status.journeyDate}</p>
                    </div>

                    <button
                      onClick={() => removeJourney(item.pnr)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Journey"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
                    <span>{item.status.source.name} → {item.status.destination.name}</span>
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                      {item.status.currentStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTriggerRefreshPnr(item.pnr)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 p-2.5 text-xs font-bold text-blue-700 transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh PNR</span>
                    </button>

                    <Link
                      href={`/train/${item.status.trainNumber}`}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gray-900 hover:bg-blue-600 hover:text-white p-2.5 text-xs font-bold text-white transition-all group"
                    >
                      <span>Track Live</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journey History (Completed Journeys) */}
        {journeys.some(j => j.status.journeyState === 'COMPLETED') && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Journey History ({journeys.filter(j => j.status.journeyState === 'COMPLETED').length})
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {journeys.filter(j => j.status.journeyState === 'COMPLETED').map((item) => (
                <div
                  key={item.pnr}
                  className="rounded-3xl border border-gray-100 bg-gray-50/60 p-5 space-y-4 opacity-90 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <span className="text-xs font-extrabold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-md">
                        COMPLETED
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1">{item.status.trainName}</h3>
                      <p className="text-xs text-gray-500 font-medium">#{item.status.trainNumber} • {item.status.journeyDate}</p>
                    </div>

                    <button
                      onClick={() => removeJourney(item.pnr)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
                    <span>{item.status.source.name} → {item.status.destination.name}</span>
                    <span className="text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-bold">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
