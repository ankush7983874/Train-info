'use client';

import React, { useState, useEffect } from 'react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useJourneyStore } from '@/store/journeyStore';
import { useQuery } from '@tanstack/react-query';
import { buildJourneyContext } from '@/lib/journeyContext';
import { generateSmartAlerts } from '@/lib/alerts';
import { AiChatMessage } from '@/types/ai';

// Components
import JourneyCountdownCard from '@/components/companion/JourneyCountdownCard';
import PlatformCoachCard from '@/components/companion/PlatformCoachCard';
import StationGuideCard from '@/components/companion/StationGuideCard';
import SmartAlertsCard from '@/components/companion/SmartAlertsCard';
import WeatherCard from '@/components/companion/WeatherCard';
import TrainComparisonCard from '@/components/companion/TrainComparisonCard';
import ShareJourneyModal from '@/components/companion/ShareJourneyModal';

// Icons
import { Sparkles, Bot, Send, Loader2, MessageSquare, Compass, ShieldCheck, Search, Mic, MicOff, Volume2, TrendingUp, AlertTriangle, ShieldAlert, Gauge, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

async function fetchRoute(trainNumber: string) {
  const res = await fetch(`/api/route/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchLive(trainNumber: string) {
  const res = await fetch(`/api/train/live/${trainNumber}`);
  if (!res.ok) return null;
  return res.json();
}

export default function AiAssistantPage() {
  const { selectedTrainNumber, setSelectedTrainNumber } = useFavoritesStore();
  const { journeys } = useJourneyStore();

  const [inputNumber, setInputNumber] = useState(selectedTrainNumber || '12301');
  const activeTrainNumber = selectedTrainNumber || '12301';

  // Active PNR if present
  const activePnr = journeys.length > 0 ? journeys[0].status : null;

  // Data queries
  const { data: routeInfo } = useQuery({
    queryKey: ['routeInfo', activeTrainNumber],
    queryFn: () => fetchRoute(activeTrainNumber),
  });

  const { data: liveStatus } = useQuery({
    queryKey: ['liveStatus', activeTrainNumber],
    queryFn: () => fetchLive(activeTrainNumber),
    refetchInterval: 30000,
  });

  // Normalized Context
  const journeyContext = buildJourneyContext(
    routeInfo
      ? {
          id: activeTrainNumber,
          number: activeTrainNumber,
          name: routeInfo.trainName,
          source: routeInfo.source,
          destination: routeInfo.destination,
          totalDistanceKm: routeInfo.totalDistanceKm,
          runsOn: ['Daily'],
          classes: ['1A', '2A', '3A'],
          avgSpeedKmH: 85,
        }
      : null,
    liveStatus,
    routeInfo,
    activePnr
  );

  const smartAlerts = generateSmartAlerts(journeyContext);

  // Chat & Voice State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your AI Journey Assistant. Loaded real-time context for Train #${journeyContext.trainNumber || '12301'}. Supports English, Hindi & Hinglish queries via Text or Voice!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const speakResponse = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported by your current browser. You can type queries in English, Hindi, or Hinglish!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleSendQuery(transcript);
      }
    };

    recognition.start();
  };

  const handleTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputNumber.trim()) {
      setSelectedTrainNumber(inputNumber.trim());
    }
  };

  const handleSendQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isAskingAi) return;

    const userMsg: AiChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingAi(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          context: journeyContext,
        }),
      });

      const data = await res.json();
      const replyText = data.answer || 'I could not process that request with current journey data.';

      const aiMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: data.suggestedActions?.[0],
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakResponse(replyText);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'AI Assistant network service is temporarily unavailable.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const suggestedQuestions = [
    'Where is my train?',
    'How late is my train?',
    'What is my next station?',
    'When will I reach?',
    'कहाँ है मेरी ट्रेन?',
    'Aapki train kitni late hai?',
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Top Header & Train Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-extrabold text-blue-700 shadow-2xs">
            <Sparkles className="h-4 w-4" />
            <span>AI Journey Intelligence Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl mt-2">
            AI Journey Dashboard & Voice Hub
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleTrainSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                placeholder="Train #"
                className="w-32 rounded-full border border-gray-200 py-1.5 pl-9 pr-3 text-xs font-bold text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              Load Train
            </button>
          </form>

          <ShareJourneyModal context={journeyContext} />
        </div>
      </div>

      {/* SECTION 1: AI INTELLIGENCE SIGNALS PANEL (Delay Prediction, Risk, ETA & Outcome) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Delay Prediction Card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              AI Delay Prediction
            </span>
            <span className="text-xs font-bold text-gray-400">
              Conf: {journeyContext.delayPrediction?.confidencePercentage}%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {journeyContext.delayPrediction?.predictedDelayRange}
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1.5">
              <span>Trend:</span>
              <span className="font-extrabold text-blue-600 capitalize">
                {journeyContext.delayPrediction?.trend}
              </span>
            </div>
          </div>
        </div>

        {/* Journey Risk Score Card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Journey Risk Score
            </span>
            <span className={clsx('text-xs font-extrabold px-2 py-0.5 rounded-full', journeyContext.journeyRisk?.overallRisk === 'LOW' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800')}>
              {journeyContext.journeyRisk?.overallRisk} RISK
            </span>
          </div>
          <div>
            <div className="text-sm font-extrabold text-gray-800">
              {journeyContext.journeyRisk?.explanation}
            </div>
            <div className="text-[11px] text-gray-400 font-medium mt-1">
              Weather Risk: {journeyContext.journeyRisk?.weatherRisk} • Delay Risk: {journeyContext.journeyRisk?.delayRisk}
            </div>
          </div>
        </div>

        {/* Outcome Prediction Card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              Outcome Prediction
            </span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900">
              {journeyContext.outcomePrediction?.outcome}
            </div>
            <p className="text-xs font-medium text-gray-500 mt-1">
              {journeyContext.outcomePrediction?.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI JOURNEY ASSISTANT CHAT & VOICE HUB */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-500/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Multilingual AI Assistant & Voice Hub</h2>
              <p className="text-xs text-gray-500 font-medium">Supports English, Hindi, and Hinglish queries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400">
              Updated {journeyContext.lastUpdated ? `${Math.round((Date.now() - new Date(journeyContext.lastUpdated).getTime()) / 1000)}s ago` : 'just now'}
            </span>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 flex items-center gap-1.5 border border-green-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Strict Real-Data
            </span>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase shrink-0">Suggested:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              className="shrink-0 rounded-full border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="h-64 overflow-y-auto rounded-2xl bg-gray-50/60 p-4 border border-gray-100 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={clsx(
                  'max-w-[85%] rounded-2xl p-4 text-xs font-medium space-y-1 shadow-2xs',
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                )}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-semibold">
                  <span>{msg.sender === 'user' ? 'You' : 'RailRadar AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed text-sm font-semibold">{msg.text}</p>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => speakResponse(msg.text)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline pt-1"
                  >
                    <Volume2 className="h-3 w-3" /> Read Aloud
                  </button>
                )}
              </div>
            </div>
          ))}
          {isAskingAi && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-xs text-gray-500 border border-gray-100 shadow-2xs">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Analyzing live railway context...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar with Voice Mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(chatInput);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type query in English, Hindi, or Hinglish..."
            className="flex-1 rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={startVoiceRecognition}
            className={clsx(
              'flex h-11 w-11 items-center justify-center rounded-2xl border transition-all',
              isListening
                ? 'bg-red-600 text-white animate-pulse border-red-600 shadow-md shadow-red-500/30'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            )}
            title={isListening ? 'Listening...' : 'Speak Question (Voice Assistant)'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            type="submit"
            disabled={isAskingAi || !chatInput.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* SECTION 3: JOURNEY COUNTDOWN & LIVE INSIGHTS */}
      <JourneyCountdownCard context={journeyContext} />

      {/* SECTION 4: SMART ALERTS */}
      <SmartAlertsCard alerts={smartAlerts} />

      {/* SECTION 5: PLATFORM & COACH POSITION */}
      <PlatformCoachCard context={journeyContext} />

      {/* SECTION 6: WEATHER ALONG JOURNEY */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Weather Along Journey</h2>
        <WeatherCard />
      </div>

      {/* SECTION 7: SMART STATION GUIDE & NEARBY PLACES */}
      <StationGuideCard context={journeyContext} />

      {/* SECTION 8: TRAIN COMPARISON */}
      <TrainComparisonCard
        currentTrain={
          routeInfo
            ? {
                id: activeTrainNumber,
                number: activeTrainNumber,
                name: routeInfo.trainName,
                source: routeInfo.source,
                destination: routeInfo.destination,
                totalDistanceKm: routeInfo.totalDistanceKm,
                runsOn: ['Daily'],
                classes: ['1A', '2A', '3A'],
                avgSpeedKmH: 85,
              }
            : null
        }
        currentRoute={routeInfo}
        currentLive={liveStatus}
      />
    </div>
  );
}

