const OPENF1_BASE = 'https://api.openf1.org/v1';

export interface OpenF1Session {
    session_key: number;
    session_name: string;
    date_start: string;
    date_end: string;
    gmt_offset: string;
    session_type: string;
    meeting_key: number;
    location: string;
    country_key: number;
    country_code: string;
    country_name: string;
    circuit_key: number;
    circuit_short_name: string;
    year: number;
}

export interface OpenF1Driver {
    session_key: number;
    meeting_key: number;
    broadcast_name: string;
    country_code: string;
    first_name: string;
    full_name: string;
    headshot_url: string;
    last_name: string;
    driver_number: number;
    team_colour: string;
    team_name: string;
    name_acronym: string;
}

interface OpenF1Interval {
    session_key: number;
    meeting_key: number;
    date: string;
    driver_number: number;
    gap_to_leader: number | null;
    interval: number | null;
}

interface OpenF1Position {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    date: string;
    position: number;
}

export interface OpenF1Lap {
    meeting_key: number;
    session_key: number;
    driver_number: number;
    i1_speed: number;
    i2_speed: number;
    st_speed: number;
    date_start: string;
    lap_duration: number;
    is_pit_out_lap: boolean;
    duration_sector_1: number;
    duration_sector_2: number;
    duration_sector_3: number;
    segments_sector_1: number[];
    segments_sector_2: number[];
    segments_sector_3: number[];
    lap_number: number;
}

// ----------------------------------------------------------------------------
// Client fetchers (With 2.5s anti-spam Promise caching to prevent 429s)
// ----------------------------------------------------------------------------

// Persist the cache in globalThis so Next.js Fast Refresh (HMR) doesn't zero it out
const globalAny = globalThis as any;
if (!globalAny.OPENF1_REQ_CACHE) {
    globalAny.OPENF1_REQ_CACHE = {};
}
const REQ_CACHE: Record<string, { expireAt: number, data: any, promise: Promise<any> | null }> = globalAny.OPENF1_REQ_CACHE;

async function fetchOpenF1Safely(endpoint: string) {
    const url = `${OPENF1_BASE}${endpoint}`;
    
    if (!REQ_CACHE[url]) {
        REQ_CACHE[url] = { expireAt: 0, data: null, promise: null };
    }

    const now = Date.now();

    // 1. Return cached data if fresh
    if (REQ_CACHE[url].expireAt > now && REQ_CACHE[url].data !== null) {
        return REQ_CACHE[url].data;
    }

    // 2. Return in-flight promise if another component just requested this exact endpoint
    if (REQ_CACHE[url].promise) {
        return await REQ_CACHE[url].promise;
    }

    // 3. Fire the actual network request and cache the Promise so others can tether to it
    REQ_CACHE[url].promise = (async () => {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`OpenF1 Error ${res.status}`);
            
            const data = await res.json();
            REQ_CACHE[url].data = data;
            REQ_CACHE[url].expireAt = Date.now() + 2500; // 2.5 second cooldown per endpoint
            return data;
        } finally {
            REQ_CACHE[url].promise = null; // Release the lock
        }
    })();

    return await REQ_CACHE[url].promise;
}

export async function fetchLiveSession(): Promise<OpenF1Session | null> {
    try {
        const data = await fetchOpenF1Safely('/sessions?session_key=latest');
        return data?.[0] || null;
    } catch {
        return null;
    }
}

/**
 * Determine if the latest session is currently active.
 * Considers a 30-min buffer after date_end to account for delayed data.
 */
export function isSessionActive(session: OpenF1Session | null): boolean {
    if (!session) return false;
    const now = Date.now();
    const start = new Date(session.date_start).getTime();
    const end = new Date(session.date_end).getTime();
    return now >= start && now <= end + 30 * 60 * 1000;
}

export async function fetchLiveDrivers(): Promise<OpenF1Driver[]> {
    try {
        return await fetchOpenF1Safely('/drivers?session_key=latest');
    } catch {
        return [];
    }
}

async function fetchLivePositions(): Promise<OpenF1Position[]> {
    try {
        const data: OpenF1Position[] = await fetchOpenF1Safely('/position?session_key=latest');
        // The API returns all positions ordered by time. We need only the LATEST position per driver.
        const latestPositions = new Map<number, OpenF1Position>();
        for (const p of data) {
            latestPositions.set(p.driver_number, p);
        }
        return Array.from(latestPositions.values()).sort((a, b) => a.position - b.position);
    } catch {
        return [];
    }
}

async function fetchLiveIntervals(): Promise<OpenF1Interval[]> {
    try {
        const data: OpenF1Interval[] = await fetchOpenF1Safely('/intervals?session_key=latest');
        const latestIntervals = new Map<number, OpenF1Interval>();
        for (const i of data) {
            latestIntervals.set(i.driver_number, i);
        }
        return Array.from(latestIntervals.values());
    } catch {
        return [];
    }
}

export async function fetchLiveLaps(): Promise<OpenF1Lap[]> {
    try {
        return await fetchOpenF1Safely('/laps?session_key=latest');
    } catch {
        return [];
    }
}

// ----- New Phase 2 endpoints -----

export interface OpenF1TeamRadio {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    date: string;
    recording_url: string;
}

export interface OpenF1RaceControl {
    session_key: number;
    meeting_key: number;
    date: string;
    category: string;
    flag?: string;
    scope?: string;
    driver_number?: number;
    message: string;
    lap_number?: number;
}

export interface OpenF1Weather {
    session_key: number;
    meeting_key: number;
    date: string;
    air_temperature: number;
    humidity: number;
    pressure: number;
    rainfall: number;
    track_temperature: number;
    wind_direction: number;
    wind_speed: number;
}

export interface OpenF1Pit {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    date: string;
    pit_duration: number;
    lap_number: number;
}

export interface OpenF1Stint {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    stint_number: number;
    lap_start: number;
    lap_end: number;
    compound: string;
    tyre_age_at_start: number;
}

export async function fetchTeamRadio(): Promise<OpenF1TeamRadio[]> {
    try {
        return await fetchOpenF1Safely('/team_radio?session_key=latest');
    } catch {
        return [];
    }
}

export async function fetchRaceControl(): Promise<OpenF1RaceControl[]> {
    try {
        return await fetchOpenF1Safely('/race_control?session_key=latest');
    } catch {
        return [];
    }
}

export async function fetchWeather(): Promise<OpenF1Weather | null> {
    try {
        const data: OpenF1Weather[] = await fetchOpenF1Safely('/weather?session_key=latest');
        return data?.[data.length - 1] || null;
    } catch {
        return null;
    }
}

export async function fetchPitStops(): Promise<OpenF1Pit[]> {
    try {
        return await fetchOpenF1Safely('/pit?session_key=latest');
    } catch {
        return [];
    }
}

export async function fetchStints(): Promise<OpenF1Stint[]> {
    try {
        return await fetchOpenF1Safely('/stints?session_key=latest');
    } catch {
        return [];
    }
}

export interface OpenF1Location {
    session_key: number;
    meeting_key: number;
    driver_number: number;
    date: string;
    x: number;
    y: number;
    z: number;
}

function recentTimestamp(secondsAgo: number): string {
    return new Date(Date.now() - secondsAgo * 1000).toISOString();
}

function safeMin(arr: number[]): number {
    let min = Infinity;
    for (const v of arr) {
        if (v < min) min = v;
    }
    return min === Infinity ? 0 : min;
}

export async function fetchCarLocations(): Promise<OpenF1Location[]> {
    try {
        const data: OpenF1Location[] = await fetchOpenF1Safely(`/location?session_key=latest&date>=${recentTimestamp(10)}`);
        // Keep only the latest position per driver
        const latest = new Map<number, OpenF1Location>();
        for (const loc of data) {
            latest.set(loc.driver_number, loc);
        }
        return Array.from(latest.values());
    } catch {
        return [];
    }
}

export interface LiveTimingRow {
    position: number;
    driverNumber: number;
    driverStr: string;
    firstName: string;
    lastName: string;
    team: string;
    color: string;
    gapToLeader: string;
    interval: string;
    latestLapTime: number | string;
    sector1: number | string;
    sector2: number | string;
    sector3: number | string;
    s1Color: 'purple' | 'green' | 'yellow';
    s2Color: 'purple' | 'green' | 'yellow';
    s3Color: 'purple' | 'green' | 'yellow';
    hasFastestLap: boolean;
    compound: string | null;
    tyreAge: number | null;
    isPitOut: boolean;
    lapsCompleted: number;
}

export async function fetchLiveTimingData(): Promise<{ session: OpenF1Session | null; grid: LiveTimingRow[] }> {
    const [session, drivers, positions, intervals, laps, stints] = await Promise.all([
        fetchLiveSession(),
        fetchLiveDrivers(),
        fetchLivePositions(),
        fetchLiveIntervals(),
        fetchLiveLaps(),
        fetchStints(),
    ]);

    // Build best sector times for color coding
    const allSector1: number[] = [];
    const allSector2: number[] = [];
    const allSector3: number[] = [];
    for (const l of laps) {
        if (l.duration_sector_1 > 0) allSector1.push(l.duration_sector_1);
        if (l.duration_sector_2 > 0) allSector2.push(l.duration_sector_2);
        if (l.duration_sector_3 > 0) allSector3.push(l.duration_sector_3);
    }
    const bestS1 = safeMin(allSector1);
    const bestS2 = safeMin(allSector2);
    const bestS3 = safeMin(allSector3);

    // Find overall fastest lap
    const allLapTimes = laps.filter(l => l.lap_duration > 0).map(l => l.lap_duration);
    const fastestLap = safeMin(allLapTimes);

    // Aggregate into a structured timeline per driver
    const liveTimingGrid = positions.map(pos => {
        const driver = drivers.find(d => d.driver_number === pos.driver_number);
        const interval = intervals.find(i => i.driver_number === pos.driver_number);
        const driverLaps = laps.filter(l => l.driver_number === pos.driver_number).sort((a, b) => a.lap_number - b.lap_number);
        const latestLap = driverLaps[driverLaps.length - 1];

        // Get current stint (tyre compound)
        const driverStints = stints.filter(s => s.driver_number === pos.driver_number).sort((a, b) => a.stint_number - b.stint_number);
        const currentStint = driverStints[driverStints.length - 1];

        // Personal best sectors for this driver
        const driverS1 = driverLaps.filter(l => l.duration_sector_1 > 0).map(l => l.duration_sector_1);
        const driverS2 = driverLaps.filter(l => l.duration_sector_2 > 0).map(l => l.duration_sector_2);
        const driverS3 = driverLaps.filter(l => l.duration_sector_3 > 0).map(l => l.duration_sector_3);
        const pbS1 = safeMin(driverS1);
        const pbS2 = safeMin(driverS2);
        const pbS3 = safeMin(driverS3);

        // Sector color: purple = overall best, green = personal best, yellow = normal
        const s1Color = (latestLap?.duration_sector_1 === bestS1 && bestS1 > 0 ? 'purple' : latestLap?.duration_sector_1 === pbS1 && pbS1 > 0 ? 'green' : 'yellow') as LiveTimingRow['s1Color'];
        const s2Color = (latestLap?.duration_sector_2 === bestS2 && bestS2 > 0 ? 'purple' : latestLap?.duration_sector_2 === pbS2 && pbS2 > 0 ? 'green' : 'yellow') as LiveTimingRow['s2Color'];
        const s3Color = (latestLap?.duration_sector_3 === bestS3 && bestS3 > 0 ? 'purple' : latestLap?.duration_sector_3 === pbS3 && pbS3 > 0 ? 'green' : 'yellow') as LiveTimingRow['s3Color'];

        const hasFastestLap = latestLap?.lap_duration === fastestLap && fastestLap > 0;

        return {
            position: pos.position,
            driverNumber: pos.driver_number,
            driverStr: driver?.name_acronym || `DK${pos.driver_number}`,
            firstName: driver?.first_name || "",
            lastName: driver?.last_name || "",
            team: driver?.team_name || "Unknown",
            color: driver?.team_colour ? `#${driver.team_colour}` : "#ffffff",
            gapToLeader: interval?.gap_to_leader !== null ? `+${interval?.gap_to_leader}` : "",
            interval: interval?.interval !== null ? `+${interval?.interval}` : "",
            latestLapTime: latestLap?.lap_duration || "--",
            sector1: latestLap?.duration_sector_1 || "--",
            sector2: latestLap?.duration_sector_2 || "--",
            sector3: latestLap?.duration_sector_3 || "--",
            s1Color,
            s2Color,
            s3Color,
            hasFastestLap,
            compound: currentStint?.compound || null,
            tyreAge: currentStint ? (latestLap?.lap_number || 0) - currentStint.lap_start + currentStint.tyre_age_at_start : null,
            isPitOut: latestLap?.is_pit_out_lap || false,
            lapsCompleted: driverLaps.length
        };
    });

    return {
        session,
        grid: liveTimingGrid
    };
}
