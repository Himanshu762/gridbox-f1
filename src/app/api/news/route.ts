import { NextResponse } from "next/server";

interface NewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
}

const RSS_FEEDS: { url: string; name: string }[] = [
    { url: "https://www.motorsport.com/rss/f1/news/", name: "Motorsport.com" },
    { url: "https://www.autosport.com/rss/f1/news/", name: "Autosport" },
    { url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml", name: "BBC Sport" },
];

function parseXmlTag(xml: string, tag: string): string {
    const open = `<${tag}>`;
    const openCdata = `<${tag}><![CDATA[`;
    const close = `</${tag}>`;

    let start = xml.indexOf(openCdata);
    if (start !== -1) {
        start += openCdata.length;
        const end = xml.indexOf(`]]>${close}`, start);
        return end !== -1 ? xml.substring(start, end).trim() : "";
    }

    start = xml.indexOf(open);
    if (start !== -1) {
        start += open.length;
        const end = xml.indexOf(close, start);
        return end !== -1 ? xml.substring(start, end).trim() : "";
    }

    return "";
}

function parseRss(xml: string, sourceName: string): NewsItem[] {
    const items: NewsItem[] = [];
    const parts = xml.split("<item>");

    for (let i = 1; i < parts.length && i <= 15; i++) {
        const chunk = parts[i];
        const title = parseXmlTag(chunk, "title").replace(/<[^>]+>/g, "");
        const link = parseXmlTag(chunk, "link");
        const description = parseXmlTag(chunk, "description")
            .replace(/<[^>]+>/g, "")
            .substring(0, 200);
        const pubDate = parseXmlTag(chunk, "pubDate");

        // Only allow http(s) links — blocks javascript:, data:, etc.
        if (title && link && /^https?:\/\//i.test(link)) {
            items.push({ title, link, description, pubDate, source: sourceName });
        }
    }

    return items;
}

async function fetchRedditPosts(): Promise<NewsItem[]> {
    try {
        const res = await fetch("https://www.reddit.com/r/formula1/hot.json?limit=20", {
            headers: { "User-Agent": "GridBoxF1/1.0" },
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const data = await res.json();

        return (data.data?.children || [])
            .filter((c: any) => !c.data.stickied)
            .slice(0, 15)
            .map((c: any) => ({
                title: c.data.title,
                link: `https://reddit.com${c.data.permalink}`,
                description: c.data.selftext?.substring(0, 200) || `${c.data.score} upvotes • ${c.data.num_comments} comments`,
                pubDate: new Date(c.data.created_utc * 1000).toISOString(),
                source: "Reddit r/formula1",
            }));
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        const feedPromises = RSS_FEEDS.map(async (feed) => {
            try {
                const res = await fetch(feed.url, { next: { revalidate: 300 } });
                if (!res.ok) return [];
                const xml = await res.text();
                return parseRss(xml, feed.name);
            } catch {
                return [];
            }
        });

        const [rssResults, reddit] = await Promise.all([
            Promise.all(feedPromises),
            fetchRedditPosts(),
        ]);

        const headlines = rssResults
            .flat()
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        return NextResponse.json({ headlines, reddit }, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
    } catch (e) {
        console.error("News API error:", e);
        return NextResponse.json({ headlines: [], reddit: [] }, { status: 500 });
    }
}
