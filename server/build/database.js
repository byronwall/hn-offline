"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var fs = require("fs");
var _ = require("lodash");
var algolia_1 = require("./algolia");
var api_1 = require("./api");
var helpers_1 = require("./helpers");
exports.db = {};
var dbPath = "./newdb.json";
function saveDatabase() {
    var dataStr = JSON.stringify(exports.db);
    fs.writeFileSync(dbPath, dataStr);
}
exports.saveDatabase = saveDatabase;
function reloadDatabase() {
    // create database if it's missing
    if (!fs.existsSync(dbPath)) {
        saveDatabase();
    }
    var dataStr = fs.readFileSync(dbPath).toString();
    exports.db = JSON.parse(dataStr);
}
exports.reloadDatabase = reloadDatabase;
function db_clearOldStories(idsToKeep) {
    return __awaiter(this, void 0, void 0, function () {
        var allIds;
        return __generator(this, function (_a) {
            allIds = Object.keys(exports.db)
                .map(function (c) { return +c; })
                .filter(function (c) { return !isNaN(c); });
            console.log("all ids in database", allIds);
            allIds.forEach(function (id) {
                var shouldKeep = _.includes(idsToKeep, id);
                if (!shouldKeep) {
                    delete exports.db[id];
                }
            });
            return [2 /*return*/, allIds.length - idsToKeep.length];
        });
    });
}
exports.db_clearOldStories = db_clearOldStories;
function db_getTopStoryIds(reqType) {
    return __awaiter(this, void 0, void 0, function () {
        var doc, shouldUpdate, ids, topstories;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    doc = exports.db[reqType];
                    if (doc !== undefined) {
                        shouldUpdate = helpers_1._getUnixTimestamp() - doc.lastUpdated > 600;
                        if (!shouldUpdate) {
                            // same type of obj as created below
                            return [2 /*return*/, doc.items];
                        }
                    }
                    return [4 /*yield*/, _getTopStories(reqType)];
                case 1:
                    ids = _a.sent();
                    topstories = {
                        id: reqType,
                        items: ids,
                        lastUpdated: helpers_1._getUnixTimestamp(),
                    };
                    // add to database
                    exports.db[reqType] = topstories;
                    return [2 /*return*/, ids];
            }
        });
    });
}
exports.db_getTopStoryIds = db_getTopStoryIds;
function addAllChildren(items) {
    return __awaiter(this, void 0, void 0, function () {
        var newItems, _i, items_1, item, freshItems;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newItems = [];
                    _i = 0, items_1 = items;
                    _a.label = 1;
                case 1:
                    if (!(_i < items_1.length)) return [3 /*break*/, 4];
                    item = items_1[_i];
                    if (!(item !== null)) return [3 /*break*/, 3];
                    return [4 /*yield*/, addChildrenToItem(item)];
                case 2:
                    freshItems = _a.sent();
                    freshItems = freshItems.filter(function (item) { return item !== null; });
                    newItems = newItems.concat(freshItems);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // console.log("new items", newItems.map(item => item.id));
                    if (newItems.length == 0) {
                        return [2 /*return*/, true];
                    }
                    else {
                        return [2 /*return*/, addAllChildren(newItems)];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function addChildrenToItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(item.kids !== undefined && item.kids.length > 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all(item.kids.map(function (kid) { return api_1.HackerNewsApi.get().fetchItem(kid); }))];
                case 1:
                    result = _a.sent();
                    // result contains all of the comments loaded, run them back into the parent
                    item.kidsObj = result;
                    delete item.kids;
                    return [2 /*return*/, item.kidsObj];
                case 2: 
                // just send  back empty array otherwise
                return [2 /*return*/, []];
            }
        });
    });
}
function addItemToDb(item) {
    var itemExt = __assign({}, item, { lastUpdated: helpers_1._getUnixTimestamp() });
    exports.db[item.id] = itemExt;
    return true;
}
function _getTopStories(type) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, topStories;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = type;
                    switch (_a) {
                        case "topstories": return [3 /*break*/, 1];
                        case "day": return [3 /*break*/, 3];
                        case "month": return [3 /*break*/, 5];
                        case "week": return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 9];
                case 1: return [4 /*yield*/, api_1.HackerNewsApi.get().fetchItemIds("topstories")];
                case 2:
                    topStories = (_b.sent()).slice(0, algolia_1.HITS_PER_PAGE);
                    return [2 /*return*/, topStories];
                case 3: return [4 /*yield*/, algolia_1.AlgoliaApi.getDay()];
                case 4: return [2 /*return*/, _b.sent()];
                case 5: return [4 /*yield*/, algolia_1.AlgoliaApi.getMonth()];
                case 6: return [2 /*return*/, _b.sent()];
                case 7: return [4 /*yield*/, algolia_1.AlgoliaApi.getWeek()];
                case 8: return [2 /*return*/, _b.sent()];
                case 9:
                    console.log("error missing type");
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function getItemFromDb(itemId) {
    var doc = exports.db[itemId];
    if (doc === undefined || _isTimePastThreshold(doc)) {
        // this is caught later and used to refresh the story
        return null;
    }
    return doc;
}
function _getFullDataForIds(itemIDs) {
    return __awaiter(this, void 0, void 0, function () {
        var itemObjs, i, obj, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(itemIDs.map(getItemFromDb))];
                case 1:
                    itemObjs = _a.sent();
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < itemObjs.length)) return [3 /*break*/, 7];
                    obj = itemObjs[i];
                    if (!(obj === null)) return [3 /*break*/, 6];
                    return [4 /*yield*/, api_1.HackerNewsApi.get().fetchItem(itemIDs[i])];
                case 3:
                    item = _a.sent();
                    return [4 /*yield*/, addChildrenToItemRecurse(item)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, addItemToDb(item)];
                case 5:
                    _a.sent();
                    itemObjs[i] = __assign({}, item, { lastUpdated: helpers_1._getUnixTimestamp() });
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, itemObjs];
            }
        });
    });
}
exports._getFullDataForIds = _getFullDataForIds;
function addChildrenToItemRecurse(item) {
    return __awaiter(this, void 0, void 0, function () {
        var newItems, freshItems;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newItems = [];
                    return [4 /*yield*/, addChildrenToItem(item)];
                case 1:
                    freshItems = _a.sent();
                    newItems = newItems.concat(freshItems);
                    // all of the kids were added... check if more kids to do
                    // console.log("new items", newItems.map(item => item.id));
                    if (newItems.length == 0) {
                        return [2 /*return*/, true];
                    }
                    else {
                        return [2 /*return*/, addAllChildren(newItems)];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function _isTimePastThreshold(itemExt) {
    if (itemExt.lastUpdated === undefined) {
        return true;
    }
    // set up to update the story if the ratio on time marks the story old
    return ((helpers_1._getUnixTimestamp() - itemExt.lastUpdated) /
        (itemExt.lastUpdated - itemExt.time) >
        0.25);
}
