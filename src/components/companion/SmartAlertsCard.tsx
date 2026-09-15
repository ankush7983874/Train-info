'use client';

import React from 'react';
import { SmartAlert } from '@/types/ai';
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface SmartAlertsCardProps {
  alerts: SmartAlert[];
}

export default function SmartAlertsCard({ alerts }: SmartAlertsCardProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-base">Smart Journey Alerts</h3>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            0 Active
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium text-center py-4">
          No live journey alerts triggered yet. Alerts fire automatically as your train approaches stations or updates delay status.
        </p>
      </div>
    );
  }

  const getAlertIcon = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'urgent':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600 shrink-0" />;
    }
  };

  const getBgStyle = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-blue-600" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Smart Journey Alerts</h3>
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {alerts.length} Live Alerts
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={clsx(
              'flex items-start gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.01]',
              getBgStyle(alert.severity)
            )}
          >
            {getAlertIcon(alert.severity)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs">{alert.title}</h4>
                <span className="text-[10px] font-semibold opacity-70">{alert.timestamp}</span>
              </div>
              <p className="text-xs font-medium mt-1 leading-relaxed">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
