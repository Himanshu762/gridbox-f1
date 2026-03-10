import type { DriverStanding, ConstructorStanding, RaceSchedule, RaceResult, Circuit, JolpicaDriver } from "./jolpica";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

// Sanitize URL path segments — only allow alphanumeric, underscore, hyphen, dot
function sanitizeParam(param: string): string {
    return param.replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

export const F1Images = {
    getDriverHeadshot: (_code: string) => "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000000/common/f1/2026/fallback/2026fallbackdriverright.webp",
};

export async function getCurrentStandings(): Promise<DriverStanding[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/current/driverStandings.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    } catch {
        return [];
    }
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/current/constructorStandings.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    } catch {
        return [];
    }
}

export async function getCurrentSchedule(): Promise<RaceSchedule[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/current.json`, { next: { revalidate: 86400 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export async function getRaceResults(season: string, round: string): Promise<RaceResult[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/${sanitizeParam(season)}/${sanitizeParam(round)}/results.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export async function getLastRaceResults(): Promise<RaceResult[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/current/last/results.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export async function getQualifyingResults(season: string, round: string): Promise<any[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/${sanitizeParam(season)}/${sanitizeParam(round)}/qualifying.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export async function getSprintResults(season: string, round: string): Promise<any[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/${sanitizeParam(season)}/${sanitizeParam(round)}/sprint.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export async function getCircuits(): Promise<Circuit[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/current/circuits.json`, { next: { revalidate: 86400 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.CircuitTable.Circuits || [];
    } catch {
        return [];
    }
}

export async function getDriverInfo(driverId: string): Promise<JolpicaDriver | null> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/drivers/${sanitizeParam(driverId)}.json`, { next: { revalidate: 86400 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.MRData.DriverTable.Drivers?.[0] || null;
    } catch {
        return null;
    }
}

export async function getDriverSeasonResults(driverId: string, season: string = "current"): Promise<any[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/${sanitizeParam(season)}/drivers/${sanitizeParam(driverId)}/results.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}

export function getSeasons(): string[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i));
}

export async function getSeasonSchedule(season: string): Promise<RaceSchedule[]> {
    try {
        const res = await fetch(`${JOLPICA_BASE}/${sanitizeParam(season)}.json`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.MRData.RaceTable.Races || [];
    } catch {
        return [];
    }
}
