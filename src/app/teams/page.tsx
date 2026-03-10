import TeamsClient from "./teams-client";
import { Metadata } from "next";
import { getConstructorStandings, getCurrentStandings } from "@/lib/api/f1-client";

export const metadata: Metadata = {
    title: "Constructor Standings — GridBox F1",
    description: "Official FIA Formula One World Championship Constructor Standings.",
};

export const revalidate = 3600;

export default async function TeamsPage() {
    const [constructors, drivers] = await Promise.all([
        getConstructorStandings(),
        getCurrentStandings(),
    ]);

    return <TeamsClient initialConstructors={constructors} initialDrivers={drivers} />;
}
