import DriversClient from "./drivers-client";
import { Metadata } from "next";
import { getCurrentStandings } from "@/lib/api/f1-client";

export const metadata: Metadata = {
    title: "Driver Standings — ParcFermé",
    description: "Official FIA Formula One World Championship Driver Standings.",
};

export const revalidate = 3600;

export default async function DriversPage() {
    const drivers = await getCurrentStandings();

    return <DriversClient initialDrivers={drivers} />;
}
