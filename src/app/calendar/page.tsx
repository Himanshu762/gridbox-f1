import CalendarClient from "./calendar-client";
import { Metadata } from "next";
import { getCurrentSchedule } from "@/lib/api/f1-client";

export const metadata: Metadata = {
    title: "Global Calendar — ParcFermé",
    description: "Interactive Formula 1 racing schedule and locations.",
};

export const revalidate = 86400;

export default async function CalendarPage() {
    const schedule = await getCurrentSchedule();

    return <CalendarClient initialSchedule={schedule} />;
}
