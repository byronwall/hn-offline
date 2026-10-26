import { query } from "@solidjs/router";

import { _getUnixTimestamp } from "~/lib/utils";

import type { HnStorySummary } from "~/models/interfaces";

type AlgoliaStoryHit = {
  objectID: string;
  title?: string;
  url?: string | null;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at_i?: number;
};

// Full-text story search across all of HN (Algolia), as list summaries.
export const searchStories = query(
  async (term: string): Promise<HnStorySummary[]> => {
    "use server";

    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=20&query=${encodeURIComponent(term)}`
    );
    if (!res.ok) {
      throw new Error(`Algolia search ${res.status}`);
    }
    const body = (await res.json()) as { hits: AlgoliaStoryHit[] };
    return body.hits.map((hit) => ({
      id: Number(hit.objectID),
      title: hit.title,
      url: hit.url ?? undefined,
      by: hit.author,
      score: hit.points,
      descendants: hit.num_comments,
      time: hit.created_at_i,
      lastUpdated: _getUnixTimestamp(),
    }));
  },
  "search-stories"
);
