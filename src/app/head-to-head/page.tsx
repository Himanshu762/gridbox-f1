import type { Metadata } from "next";
import HeadToHeadClient from "./h2h-client";

export const metadata: Metadata = {
    title: "Head-to-Head | ParcFermé",
    description: "Compare two F1 drivers side by side — stats, results, and performance.",
};

export default function HeadToHeadPage() {
    return <HeadToHeadClient />;
}
