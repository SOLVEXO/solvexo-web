import { useState, useEffect } from 'react';

// Countdown to local midnight — real, deterministic timer (not tied to a
// fabricated campaign end-time); frames "today's deals" honestly.
function msToMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function useCountdownToMidnight() {
  const [ms, setMs] = useState(msToMidnight);
  useEffect(() => {
    const id = setInterval(() => setMs(msToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    h: pad(Math.floor(ms / 3_600_000)),
    m: pad(Math.floor((ms % 3_600_000) / 60_000)),
    s: pad(Math.floor((ms % 60_000) / 1000)),
  };
}
