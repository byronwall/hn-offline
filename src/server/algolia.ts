import { _getUnixTimestamp } from "~/lib/utils";

export const HITS_PER_PAGE = 50;

type AlgoliaRes = { hits: AlgoliaHit[] };
type AlgoliaHit = { objectID: string };

export class AlgoliaApi {
  static async getFrontPage(): Promise<number[]> {
    const options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${HITS_PER_PAGE}`,
      json: true,
    };

    const results = (await (await fetch(options.uri)).json()) as AlgoliaRes;
    return results.hits.map((result) => Number.parseInt(result.objectID));
  }

  static async getAllByQuery(query: string): Promise<number[]> {
    const querySafe = encodeURIComponent(query);

    const options = {
      uri: `https://hn.algolia.com/api/v1/search?query=${querySafe}&tags=story&hitsPerPage=${HITS_PER_PAGE}`,

      json: true,
    };

    const results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    const hits = results.hits;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return hits.map((result) => Number.parseInt(result.objectID));
  }
  static async getDay(): Promise<number[]> {
    const timestamp = _getUnixTimestamp() - 60 * 60 * 24;

    const options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    const results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    const hits = results.hits;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return hits.map((result) => Number.parseInt(result.objectID));
  }

  static async getWeek(): Promise<number[]> {
    const timestamp = _getUnixTimestamp() - 60 * 60 * 24 * 7;

    const options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    const results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return results.hits.map((result) => Number.parseInt(result.objectID));
  }

  static async getMonth(): Promise<number[]> {
    const timestamp = _getUnixTimestamp() - 60 * 60 * 24 * 30;

    const options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    const results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return results.hits.map((result) => Number.parseInt(result.objectID));
  }
}
