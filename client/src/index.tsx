import "@blueprintjs/core/lib/css/blueprint.css";

import localForage from "localforage";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";
import smoothscroll from "smoothscroll-polyfill";

import { App } from "./App";
import * as serviceWorker from "./serviceWorker";

import { Provider } from "unstated";
import { DataLayer } from "./DataLayer";

// kick off the polyfill!
smoothscroll.polyfill();

window.onerror = function (msg, url, lineNo, columnNo, error) {
  // ... handle error ...
  console.error("major error", msg);
  localForage.clear();

  document.body.innerHTML =
    "<h1>major error occurred.  local storage cleared to avoid corruption. please refresh.</h1>";
};

// check if version exists
const version = localStorage.getItem("VERSION");
if (version === null) {
  localForage.clear();
}

localStorage.setItem("VERSION", "1.0");

export const GLOBAL_DATA_LAYER = new DataLayer();

ReactDOM.render(
  <BrowserRouter>
    <Route path={["/story/:storyId", "/:page?"]}>
      <Provider inject={[GLOBAL_DATA_LAYER]}>
        <App />
      </Provider>
    </Route>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
