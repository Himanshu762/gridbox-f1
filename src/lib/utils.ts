import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// F1 Team Colors — 2026 Season
const TEAM_COLORS: Record<string, { primary: string; secondary: string; name: string }> = {
  red_bull: { primary: '#3671C6', secondary: '#FFD700', name: 'Oracle Red Bull Racing' },
  mclaren: { primary: '#FF8000', secondary: '#47C7FC', name: 'McLaren F1 Team' },
  ferrari: { primary: '#E8002D', secondary: '#FFEB3B', name: 'Scuderia Ferrari' },
  mercedes: { primary: '#27F4D2', secondary: '#000000', name: 'Mercedes-AMG PETRONAS F1 Team' },
  aston_martin: { primary: '#229971', secondary: '#CEDC00', name: 'Aston Martin Aramco F1 Team' },
  alpine: { primary: '#FF87BC', secondary: '#0093CC', name: 'BWT Alpine F1 Team' },
  williams: { primary: '#1868DB', secondary: '#00A3E0', name: 'Williams Racing' },
  rb: { primary: '#6692FF', secondary: '#FFFFFF', name: 'Racing Bulls' },
  racing_bulls: { primary: '#6692FF', secondary: '#FFFFFF', name: 'Racing Bulls' },
  haas: { primary: '#DEE1E2', secondary: '#E6002D', name: 'MoneyGram Haas F1 Team' },
  audi: { primary: '#FF2D00', secondary: '#000000', name: 'Audi F1 Team' },
  kick_sauber: { primary: '#FF2D00', secondary: '#000000', name: 'Audi F1 Team' },
  sauber: { primary: '#FF2D00', secondary: '#000000', name: 'Audi F1 Team' },
  cadillac: { primary: '#FFB81C', secondary: '#000000', name: 'Cadillac F1 Team' },
};

export function formatLapTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}` : secs;
}

export function formatCountdown(targetDate: Date): { days: number; hours: number; mins: number; secs: number } {
  const now = new Date();
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    secs: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId]?.primary || '#ffffff';
}

export function getFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    BH: '🇧🇭', SA: '🇸🇦', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳',
    US: '🇺🇸', IT: '🇮🇹', MC: '🇲🇨', CA: '🇨🇦', ES: '🇪🇸',
    AT: '🇦🇹', GB: '🇬🇧', HU: '🇭🇺', BE: '🇧🇪', NL: '🇳🇱',
    AZ: '🇦🇿', SG: '🇸🇬', MX: '🇲🇽', BR: '🇧🇷', QA: '🇶🇦',
    AE: '🇦🇪', DE: '🇩🇪', FR: '🇫🇷', FI: '🇫🇮', TH: '🇹🇭',
    AU2: '🇦🇺', NZ: '🇳🇿', AR: '🇦🇷', DK: '🇩🇰', SE: '🇸🇪',
    MY: '🇲🇾', PL: '🇵🇱', CO: '🇨🇴', RU: '🇷🇺', ZA: '🇿🇦',
  };
  return flags[countryCode] || '🏁';
}

export function getNationalityFlag(nationality: string): string {
  const map: Record<string, string> = {
    Dutch: '🇳🇱', British: '🇬🇧', Spanish: '🇪🇸', Mexican: '🇲🇽',
    Monegasque: '🇲🇨', Australian: '🇦🇺', Canadian: '🇨🇦', French: '🇫🇷',
    German: '🇩🇪', Finnish: '🇫🇮', Japanese: '🇯🇵', Chinese: '🇨🇳',
    Thai: '🇹🇭', Danish: '🇩🇰', American: '🇺🇸', Italian: '🇮🇹',
    'New Zealander': '🇳🇿', Argentine: '🇦🇷', Brazilian: '🇧🇷',
    Swiss: '🇨🇭', Austrian: '🇦🇹', Belgian: '🇧🇪', Polish: '🇵🇱',
    Colombian: '🇨🇴', Russian: '🇷🇺', Swedish: '🇸🇪', Indian: '🇮🇳',
    Malaysian: '🇲🇾', 'South African': '🇿🇦', Hungarian: '🇭🇺',
    Portuguese: '🇵🇹', Irish: '🇮🇪', Korean: '🇰🇷', Indonesian: '🇮🇩',
    Singaporean: '🇸🇬', Saudi: '🇸🇦', Emirati: '🇦🇪', Qatari: '🇶🇦',
  };
  return map[nationality] || '🏁';
}
