"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var compression = require("compression");
var express = require("express");
var path = require("path");
var cors = require("cors");
var database_1 = require("./database");
var cachedData = {};
var Server = /** @class */ (function () {
    function Server() {
    }
    Server.start = function () {
        var _this = this;
        var app = express();
        app.use(bodyParser.json());
        app.use(compression());
        app.use(cors());
        // this assumes that the app is running in server/build
        app.use(express.static(path.join(__dirname, "../../client/build")));
        app.get("/topstories/:type", function (req, res) {
            // return a set of 30 stories with the title, comment count, and URL
            // add those to the DB and set some flag saying that they need full details loaded
            // load the first layer and note that more could be loaded
            // store those top stories for some period of time
            var params = req.params;
            var reqType = params.type;
            console.log(new Date(), reqType);
            res.json(cachedData[reqType]);
            // find that type...
        });
        app.get("/api/story/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var params, storyId, storyData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = req.params;
                        storyId = params.id;
                        console.log(new Date(), "req story", storyId);
                        return [4 /*yield*/, database_1._getFullDataForIds([+storyId])];
                    case 1:
                        storyData = _a.sent();
                        // load the single story and then return
                        if (storyData.length > 0) {
                            res.json(storyData[0]);
                            return [2 /*return*/];
                        }
                        res.json({ error: "story not found" });
                        return [2 /*return*/];
                }
            });
        }); });
        var reactClientPaths = ["/", "/day", "/week", "/month", "/story/*"];
        app.get(reactClientPaths, function (req, res) {
            // need to respond to all pages so that BrowserRouter works
            res.sendFile(path.join(__dirname, "../../client/build/index.html"));
        });
        var port = process.env.PORT || 3001;
        app.listen(port);
        // set up the auto download
        database_1.reloadDatabase();
        setInterval(updateData, 10 * 60 * 1000);
        updateData();
        console.log("server is running on port: " + port);
    };
    return Server;
}());
exports.Server = Server;
var index = 0;
function updateData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadFreshDataForStoryType("topstories")];
                case 1:
                    _a.sent();
                    if (!(index % 6 === 0)) return [3 /*break*/, 3];
                    // every hour
                    return [4 /*yield*/, loadFreshDataForStoryType("day")];
                case 2:
                    // every hour
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (!(index % (6 * 6) === 0)) return [3 /*break*/, 5];
                    // every 6 hours
                    return [4 /*yield*/, loadFreshDataForStoryType("week")];
                case 4:
                    // every 6 hours
                    _a.sent();
                    _a.label = 5;
                case 5:
                    if (!(index % (6 * 24) === 0)) return [3 /*break*/, 7];
                    // every 24 hours -- only used to clean up history now
                    return [4 /*yield*/, loadFreshDataForStoryType("month")];
                case 6:
                    // every 24 hours -- only used to clean up history now
                    _a.sent();
                    index = 1;
                    _a.label = 7;
                case 7:
                    index++;
                    return [2 /*return*/];
            }
        });
    });
}
function loadFreshDataForStoryType(storyType) {
    return __awaiter(this, void 0, void 0, function () {
        var idsToKeep_1, idArr, removeCount, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(new Date(), "calling for update to", storyType);
                    if (!(storyType === "month")) return [3 /*break*/, 2];
                    console.log("clearing old stories");
                    idsToKeep_1 = new Set();
                    Object.keys(cachedData).forEach(function (key) {
                        cachedData[key].forEach(function (story) {
                            idsToKeep_1.add(story.id);
                        });
                    });
                    idArr = Array.from(idsToKeep_1);
                    console.log("keeping IDs", idArr);
                    return [4 /*yield*/, database_1.db_clearOldStories(idArr)];
                case 1:
                    removeCount = _a.sent();
                    console.log("removed stories: " + removeCount);
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, database_1.db_getTopStoryIds(storyType).then(function (ids) {
                        return database_1._getFullDataForIds(ids);
                    })];
                case 3:
                    results = _a.sent();
                    // save result to local cache... will be served
                    cachedData[storyType] = results;
                    _a.label = 4;
                case 4:
                    database_1.saveDatabase();
                    console.log(new Date(), "update complete", storyType);
                    return [2 /*return*/];
            }
        });
    });
}
