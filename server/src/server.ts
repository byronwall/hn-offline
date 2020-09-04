import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as express from "express";
import * as path from "path";
import * as cors from "cors";

import {
  _getFullDataForIds,
  db_getTopStoryIds,
  db_clearOldStories,
  saveDatabase,
  reloadDatabase,
} from "./database";
import { ItemExt, TopStoriesParams, TopStoriesType } from "./interfaces";

const cachedData: { [key: string]: ItemExt[] } = {};

const staticPath = path.join(__dirname, "static");
console.log("static path: ", staticPath);

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

      let params: TopStoriesParams = req.params;
      let reqType = params.type;

      console.log(new Date(), reqType);
      res.json(cachedData[reqType]);

      // find that type...
    });

    app.get("/api/story/:id", async (req, res) => {
      // loads the details for a single story -- results are saved to DB but not cached

      let params: { id: string } = req.params;
      let storyId = params.id;

      console.log(new Date(), "req story", storyId);

      const storyData = await _getFullDataForIds([+storyId]);

      // load the single story and then return
      if (storyData.length > 0) {
        res.json(storyData[0]);
        return;
      }

      res.json({ error: "story not found" });
    });

    const reactClientPaths = ["/", "/day", "/week", "/month", "/story/*"];

    app.get(reactClientPaths, (req, res) => {
      // need to respond to all pages so that BrowserRouter works
      res.sendFile(path.join(staticPath, "index.html"));
    });

    var port = process.env.PORT || 3001;
    app.listen(port);

    // set up the auto download

    reloadDatabase();

    setInterval(updateData, 10 * 60 * 1000);
    updateData();

    console.log("server is running on port: " + port);
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
  console.log(new Date(), "calling for update to", storyType);

  // clear out old stories as needed -- will happen daily
  if (storyType === "month") {
    console.log("clearing old stories");
    const idsToKeep = new Set<number>();
    Object.keys(cachedData).forEach((key) => {
      cachedData[key].forEach((story) => {
        idsToKeep.add(story.id);
      });
    });

    const idArr = Array.from(idsToKeep);
    console.log("keeping IDs", idArr);
    const removeCount = await db_clearOldStories(idArr);
    console.log("removed stories: " + removeCount);
  } else {
    // get the data
    const results = await db_getTopStoryIds(storyType).then((ids) => {
      return _getFullDataForIds(ids);
    });

    // save result to local cache... will be served
    cachedData[storyType] = results;
  }

  saveDatabase();
  console.log(new Date(), "update complete", storyType);
}
