import type { Metadata } from "next";
import NewsClient from "./news-client";

export const metadata: Metadata = {
    title: "F1 News | GridBox F1",
    description: "Latest Formula 1 news from top sources and Reddit community.",
};

export default function NewsPage() {
    return <NewsClient />;
}
