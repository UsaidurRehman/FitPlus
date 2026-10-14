// Small helper functions shared between screens.
// Kept in one file so a junior dev can find them quickly.

export function todayIso(): string {
  // Returns today's date in YYYY-MM-DD format (local time).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatLongDate(d: Date = new Date()): string {
  // "Monday, October 14"
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function caloriePercent(eaten: number, target: number): number {
  if (target <= 0) return 0;
  const pct = Math.round((eaten / target) * 100);
  return Math.min(100, Math.max(0, pct));
}

export function caloriesLeft(eaten: number, target: number): number {
  return Math.max(0, target - eaten);
}
