"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("./server");
// uncomment lines to profile server
// import * as fs from "fs";
// const profiler = require("v8-profiler");
// const id = Date.now() + ".profile"; // start profiling
// profiler.startProfiling(id); // stop profiling in n seconds and exit
// setTimeout(() => {
//   const profile = JSON.stringify(profiler.stopProfiling(id));
//   fs.writeFile(`${__dirname}/../profiles/${id}`, profile, () => {
//     console.log("profiling done, written to:", id);
//     process.exit(); // if you want
//   });
// }, 60 * 1000);
server_1.Server.start();
