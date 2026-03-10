import type { Metadata } from "next";
import StrategyClient from "./strategy-client";

export const metadata: Metadata = {
    title: "Strategy Analysis | GridBox F1",
    description: "Tyre strategy visualization and pit stop analysis for the latest session.",
};

export default function StrategyPage() {
    return <StrategyClient />;
}
