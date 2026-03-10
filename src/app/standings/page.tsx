import StandingsClient from "./standings-client";
import { Metadata } from "next";
import { getCurrentStandings, getConstructorStandings } from "@/lib/api/f1-client";

export const metadata: Metadata = {
    title: "Championship Standings — GridBox F1",
    description: "Current points and performance trajectory.",
};

export const revalidate = 3600;

export default async function StandingsPage() {
    const [drivers, constructors] = await Promise.all([
        getCurrentStandings(),
        getConstructorStandings(),
    ]);

    return <StandingsClient initialDrivers={drivers} initialConstructors={constructors} />;
}
