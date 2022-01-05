import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import debug from "debug";

const log = debug("hn:server");
log("log created!");

import {
  _getFullDataForIds,
  db_getTopStoryIds,
  db_clearOldStories,
  saveDatabase,
  reloadDatabase,
  getItemFromDb,
} from "./database";
import {
  ItemExt,
  STORY_TYPE,
  TopStoriesParams,
  TopStoriesType,
} from "./interfaces";
import { AlgoliaApi } from "./algolia";
import { HackerNewsApi } from "./api";

const cachedData: { [key: string]: ItemExt[] | null } = {};

const env = process.env.NODE_ENV || "development";
const staticPath =
  env === "development"
    ? path.join(__dirname, "..", "build", "static")
    : path.join(__dirname, "static");

log("static path: ", staticPath);

const indexEjs = path.join(staticPath, "index.html");

export class Server {
  static start() {
    const app = express();

    app.use(bodyParser.json());
    app.use(compression());

    app.use(cors());

    // this assumes that the app is running in server/build
    app.use(express.static(staticPath));

    app.get("/topstories/:type", (req, res) => {
      // return a set of 30 stories with the title, comment count, and URL
      // add those to the DB and set some flag saying that they need full details loaded
      // load the first layer and note that more could be loaded
      // store those top stories for some period of time

      let params = req.params;
      let reqType = params.type;

      if (STORY_TYPE.indexOf(reqType as any) === -1) {
        res.status(500).send("Incorrect story type");
        return;
      }

      if (reqType) log(new Date(), reqType);
      res.json(cachedData[reqType]);

      // find that type...
    });

    app.get("/api/story/:id", async (req, res) => {
      // loads the details for a single story -- results are saved to DB but not cached

      let params = req.params as { id: string };
      let storyId = params.id;

      log(new Date(), "req story", storyId);

      const storyData = await _getFullDataForIds([+storyId]);

      // load the single story and then return
      if (storyData.length > 0) {
        res.json(storyData[0]);
        return;
      }

      res.json({ error: "story not found" });
    });
    app.get("/api/search/:query", async (req, res) => {
      // loads the details for a single story -- results are saved to DB but not cached

      let params = req.params as { query: string };
      let query = params.query;

      log(new Date(), "search", query);

      const storyIds = await AlgoliaApi.getAllByQuery(query);

      const thinStoryData = await HackerNewsApi.get().fetchItems(storyIds);

      // load the single story and then return
      if (thinStoryData.length > 0) {
        res.json(thinStoryData);
        return;
      }

      res.json({ error: "search had no results" });
    });

    const reactClientPaths = ["/", "/day", "/week", "/month", "/story/:id"];

    app.get(reactClientPaths, (req, res) => {
      // need to respond to all pages so that BrowserRouter works
      const newTitle = getPageTitle(+req.params.id);
      log("return the raw page", req.query, newTitle);
      res.render(indexEjs, { title: newTitle });
    });

    var port = process.env.PORT || 3001;
    app.listen(port);

    // set up the auto download

    reloadDatabase();

    setInterval(updateData, 10 * 60 * 1000);
    updateData();

    log("server is running on port: " + port);
  }
}

let index = 0;
async function updateData() {
  await loadFreshDataForStoryType("topstories");

  if (index % 6 === 0) {
    // every hour
    await loadFreshDataForStoryType("day");
  }
  if (index % (6 * 6) === 0) {
    // every 6 hours
    await loadFreshDataForStoryType("week");
  }
  if (index % (6 * 24) === 0) {
    // every 24 hours -- only used to clean up history now
    await loadFreshDataForStoryType("month");
    index = 1;
  }

  index++;
}

async function loadFreshDataForStoryType(storyType: TopStoriesType) {
  log(new Date(), "calling for update to", storyType);

  // clear out old stories as needed -- will happen daily
  if (storyType === "month") {
    log("clearing old stories");
    const idsToKeep = new Set<number>();
    Object.keys(cachedData).forEach((key) => {
      cachedData[key].forEach((story) => {
        if (story === null) {
          return;
        }
        idsToKeep.add(story.id);
      });
    });

    const idArr = Array.from(idsToKeep);
    log("keeping IDs", idArr);
    const removeCount = await db_clearOldStories(idArr);
    log("removed stories: " + removeCount);
  } else {
    // get the data
    const results = await db_getTopStoryIds(storyType).then((ids) => {
      return _getFullDataForIds(ids);
    });

    // save result to local cache... will be served
    cachedData[storyType] = results;
  }

  saveDatabase();
  log(new Date(), "update complete", storyType);
}

function getPageTitle(id: number) {
  // need to find the title if possible
  const item = getItemFromDb(id);

  if (item === null) {
    return "HN Offline";
  }

  return `HN: ${item.title}`;
}
