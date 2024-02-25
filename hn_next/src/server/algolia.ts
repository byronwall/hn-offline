import { _getUnixTimestamp } from "@/utils";

export const HITS_PER_PAGE = 50;

type AlgoliaRes = { hits: AlgoliaHit[] };
type AlgoliaHit = { objectID: string };

export class AlgoliaApi {
  static async getAllByQuery(query: string): Promise<number[]> {
    const querySafe = encodeURIComponent(query);

    var options = {
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
    let timestamp = _getUnixTimestamp() - 60 * 60 * 24;

    var options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    let results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    const hits = results.hits;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return hits.map((result) => Number.parseInt(result.objectID));
  }

  static async getWeek(): Promise<number[]> {
    let timestamp = _getUnixTimestamp() - 60 * 60 * 24 * 7;

    var options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    let results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return results.hits.map((result) => Number.parseInt(result.objectID));
  }

  static async getMonth(): Promise<number[]> {
    let timestamp = _getUnixTimestamp() - 60 * 60 * 24 * 30;

    var options = {
      uri: `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=${HITS_PER_PAGE}&numericFilters=created_at_i>${timestamp}`,

      json: true,
    };

    let results = (await (await fetch(options.uri)).json()) as AlgoliaRes;

    // these will be strings not numbers at first
    // note the object is .hits for the main data
    return results.hits.map((result) => Number.parseInt(result.objectID));
  }
}
