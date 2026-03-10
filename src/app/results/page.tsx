import type { Metadata } from "next";
import ResultsClient from "./results-client";

export const metadata: Metadata = {
    title: "Race Results | ParcFermé",
    description: "Full race, qualifying, and sprint results for every Grand Prix.",
};

export default function ResultsPage() {
    return <ResultsClient />;
}
