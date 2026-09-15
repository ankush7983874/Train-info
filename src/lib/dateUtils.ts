/**
 * Date utility functions for Indian Standard Time (IST - Asia/Kolkata)
 */

export interface DateDetails {
  isoDateStr: string;   // e.g. "2026-09-14"
  shortDateStr: string; // e.g. "14 Sep"
  fullDateStr: string;  // e.g. "14 Sep 2026" (DD MMM YYYY)
  dayName: string;      // e.g. "Mon"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  presetKey: 'yesterday' | 'today' | 'tomorrow' | 'custom';
  statusBadge: string;
}

/**
 * Returns current date string in IST (Asia/Kolkata) as YYYY-MM-DD
 */
export function getISTTodayIso(): string {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = istFormatter.formatToParts(now);
  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'day') day = part.value;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Returns formatted DateDetails for any given ISO date string (YYYY-MM-DD) in IST.
 */
export function formatDateDetails(isoDateStr: string): DateDetails {
  const todayIso = getISTTodayIso();

  // Parse YYYY-MM-DD safely at midnight IST
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const targetDate = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+05:30`);

  const [ty, tm, td] = todayIso.split('-').map(Number);
  const todayDate = new Date(`${ty}-${String(tm).padStart(2, '0')}-${String(td).padStart(2, '0')}T00:00:00+05:30`);

  const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isPast = diffDays < 0;
  const isFuture = diffDays > 0;

  let presetKey: 'yesterday' | 'today' | 'tomorrow' | 'custom' = 'custom';
  let statusBadge = 'Scheduled';

  if (diffDays === 0) {
    presetKey = 'today';
    statusBadge = 'Running / Live';
  } else if (diffDays === -1) {
    presetKey = 'yesterday';
    statusBadge = 'Completed / Historical';
  } else if (diffDays === 1) {
    presetKey = 'tomorrow';
    statusBadge = 'Scheduled';
  } else if (isPast) {
    statusBadge = 'Historical';
  } else {
    statusBadge = 'Future Scheduled';
  }

  const dayName = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(targetDate);
  const dayNum = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(targetDate);
  const monthShort = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).format(targetDate);
  const yearFull = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(targetDate);

  return {
    isoDateStr,
    shortDateStr: `${dayNum} ${monthShort}`,
    fullDateStr: `${dayNum} ${monthShort} ${yearFull}`,
    dayName,
    isToday,
    isPast,
    isFuture,
    presetKey,
    statusBadge,
  };
}

/**
 * Returns ISO strings for Yesterday, Today, Tomorrow in IST.
 */
export function getPresetDateIsos(): { yesterday: string; today: string; tomorrow: string } {
  const todayIso = getISTTodayIso();
  const [y, m, d] = todayIso.split('-').map(Number);
  const todayDate = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+05:30`);

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const toIso = (dateObj: Date) => {
    const yr = dateObj.getFullYear();
    const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dy = String(dateObj.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  return {
    yesterday: toIso(yesterdayDate),
    today: todayIso,
    tomorrow: toIso(tomorrowDate),
  };
}

/**
 * Checks if a train operates on a given day of the week (e.g., 'Sun', 'Mon').
 */
export function isTrainOperatingOnDay(runsOn: string[] | undefined, dayName: string): boolean {
  if (!runsOn || runsOn.length === 0) return true;

  const normalizedDay = dayName.toLowerCase().slice(0, 3);
  return runsOn.some((r) => r.toLowerCase().slice(0, 3) === normalizedDay);
}
