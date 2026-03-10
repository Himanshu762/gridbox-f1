import type { Metadata } from "next";
import CircuitsClient from "./circuits-client";
import { getCircuits, getCurrentSchedule } from "@/lib/api/f1-client";

export const metadata: Metadata = {
    title: "Circuit Encyclopedia | GridBox F1",
    description: "Explore every Formula 1 circuit on the current calendar.",
};

export const revalidate = 86400;

export default async function CircuitsPage() {
    const [circuits, schedule] = await Promise.all([
        getCircuits(),
        getCurrentSchedule(),
    ]);

    return <CircuitsClient initialCircuits={circuits} initialSchedule={schedule} />;
}
