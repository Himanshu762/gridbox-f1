import HomeClient from "./home-client";
import { getCurrentStandings, getCurrentSchedule, getLastRaceResults, getConstructorStandings } from "@/lib/api/f1-client";

export const revalidate = 3600;

export default async function Home() {
    const [drivers, races, lastRace, constructors] = await Promise.all([
        getCurrentStandings(),
        getCurrentSchedule(),
        getLastRaceResults(),
        getConstructorStandings(),
    ]);

    // Compute next race
    let nextRace = null;
    let nextRaceDate: Date | null = null;
    if (races && races.length > 0) {
        const now = new Date();
        nextRace = races.find((r: any) => new Date(r.date + "T" + (r.time || "00:00:00Z")) > now) || races[races.length - 1];
        if (nextRace) {
            nextRaceDate = new Date(nextRace.date + "T" + (nextRace.time || "00:00:00Z"));
        }
    }

    // Compute top 3 drivers
    let topDrivers: any[] = [];
    if (drivers && drivers.length > 0) {
        topDrivers = drivers.slice(0, 3).map((drv: any) => {
            const code = drv.Driver.code || drv.Driver.familyName.substring(0, 3).toUpperCase();
            return {
                name: `${drv.Driver.givenName} ${drv.Driver.familyName}`,
                code,
                team: drv.Constructors[0].name,
                teamId: drv.Constructors[0].constructorId,
                points: parseFloat(drv.points),
                nationality: drv.Driver.nationality,
                number: parseInt(drv.Driver.permanentNumber) || 1,
            };
        });
    }

    // Extract top 10 from last race + race name
    let lastRaceResults: any[] = [];
    let lastRaceName = "";
    if (lastRace && lastRace.length > 0 && lastRace[0].Results) {
        lastRaceName = lastRace[0].raceName || "";
        lastRaceResults = lastRace[0].Results.slice(0, 10).map((r: any) => ({
            position: r.position,
            driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
            code: r.Driver.code || r.Driver.familyName.substring(0, 3).toUpperCase(),
            team: r.Constructor.name,
            teamId: r.Constructor.constructorId,
            time: r.Time?.time || r.status,
            nationality: r.Driver.nationality,
            fastestLap: r.FastestLap?.rank === "1",
        }));
    }

    // Season stats
    const completedRaces = races ? races.filter((r: any) => new Date(r.date + "T" + (r.time || "00:00:00Z")) < new Date()).length : 0;
    const totalRaces = races ? races.length : 0;
    const constructorLeader = constructors && constructors.length > 0 ? {
        name: constructors[0].Constructor.name,
        constructorId: constructors[0].Constructor.constructorId,
        points: parseFloat(constructors[0].points),
    } : null;

    const initialData = {
        nextRace,
        topDrivers,
        lastRaceResults,
        lastRaceName,
        nextRaceDate: nextRaceDate ? nextRaceDate.toISOString() : null,
        completedRaces,
        totalRaces,
        constructorLeader,
    };

    return <HomeClient initialData={initialData as any} />;
}
