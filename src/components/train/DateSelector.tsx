'use client';

import React from 'react';
import { DateDetails, getPresetDateIsos, formatDateDetails, isTrainOperatingOnDay } from '@/lib/dateUtils';
import { Calendar, CheckCircle2, AlertTriangle, Clock, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';

interface DateSelectorProps {
  selectedIsoDate: string;
  onSelectDateIso: (isoDate: string) => void;
  runsOn?: string[];
}

export default function DateSelector({
  selectedIsoDate,
  onSelectDateIso,
  runsOn,
}: DateSelectorProps) {
  const presets = getPresetDateIsos();
  const dateDetails = formatDateDetails(selectedIsoDate);
  const isOperating = isTrainOperatingOnDay(runsOn, dateDetails.dayName);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50 space-y-4">
      {/* Top Header with Running Date Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full">
              Running Date Selection
            </span>
            <h3 className="text-xl font-black text-gray-900 mt-0.5">
              Running Date: <span className="text-blue-600">{dateDetails.fullDateStr}</span>
            </h3>
          </div>
        </div>

        {/* Operating status badge */}
        <div className="flex items-center gap-2">
          {isOperating ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-xs font-bold text-green-700 border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Operates on {dateDetails.dayName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Does Not Operate on {dateDetails.dayName}
            </span>
          )}
        </div>
      </div>

      {/* Date Options Controls (Quick Preset Buttons + Custom Date Picker Input) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Yesterday Button */}
        <button
          onClick={() => onSelectDateIso(presets.yesterday)}
          className={clsx(
            'flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200',
            selectedIsoDate === presets.yesterday
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20 scale-[1.02]'
              : 'bg-gray-50 text-gray-800 border-gray-100 hover:bg-gray-100'
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Yesterday</span>
          <span className="text-sm font-black mt-0.5">{formatDateDetails(presets.yesterday).shortDateStr}</span>
        </button>

        {/* Today Button */}
        <button
          onClick={() => onSelectDateIso(presets.today)}
          className={clsx(
            'flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200',
            selectedIsoDate === presets.today
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20 scale-[1.02]'
              : 'bg-gray-50 text-gray-800 border-gray-100 hover:bg-gray-100'
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Today (Live)</span>
          <span className="text-sm font-black mt-0.5">{formatDateDetails(presets.today).shortDateStr}</span>
        </button>

        {/* Tomorrow Button */}
        <button
          onClick={() => onSelectDateIso(presets.tomorrow)}
          className={clsx(
            'flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200',
            selectedIsoDate === presets.tomorrow
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20 scale-[1.02]'
              : 'bg-gray-50 text-gray-800 border-gray-100 hover:bg-gray-100'
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Tomorrow</span>
          <span className="text-sm font-black mt-0.5">{formatDateDetails(presets.tomorrow).shortDateStr}</span>
        </button>

        {/* Custom Calendar Date Picker Input */}
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white transition-all">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600" /> Custom Date
          </label>
          <input
            type="date"
            value={selectedIsoDate}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDateIso(e.target.value);
              }
            }}
            className="w-full text-center bg-transparent text-xs font-black text-gray-900 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Date Notice Banner */}
      {!isOperating && (
        <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 flex items-center gap-3 text-xs font-bold text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Train does not operate on this date ({dateDetails.fullDateStr}). Scheduled operating days: {runsOn?.join(', ') || 'N/A'}.
          </span>
        </div>
      )}
    </div>
  );
}
