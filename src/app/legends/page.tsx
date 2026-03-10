import type { Metadata } from "next";
import LegendsClient from "./legends-client";

export const metadata: Metadata = {
    title: "Team Radio & Race Control | GridBox F1",
    description: "Live team radio clips and race control messages from the FIA, powered by OpenF1.",
};

export default function LegendsPage() {
    return <LegendsClient />;
}
