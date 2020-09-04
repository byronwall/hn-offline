# HN Offline

This is a simple web app to read Hacker News comments by storing a local copy. App uses service workers and local storage to provide fully offline HN reading. The goal of this app is to read the comments. It does not provide an offline version of any articles or non-HN links.

## Features

- Optimized for lurking. No ability to login, comment, or do anything other than read comments and follow links.
- Three main views for accessing stories: front page, day, and week. Each view provides 50 stories. Infinite scroll is intentionally avoided.
  - When loading a list of stories, _all_ comments are loaded for _all_ stories. Experience says loading all 3 pages will require around 15MB of local storage.
- App locally stores HN pages that have been visited to grey them out on the main page.
- No logging, analytics or other tracking on the server.
- Optimized for mobile including `code` blocks which normally look awful.
- Any links to other HN articles are automatically loaded in the app.
- While reading comment threads, a pleasant UX is provided to:
  - Click to collapse a thread and its children. A clickable margin is provided for each parent level on every child.
  - Click the right margin of the comment to make deeply nested comments wider.
  - Comment collapse state is stored in the current session.
    - If you leave a story and come back the comments will return to their previous state.

## How It Works

This is a simple web app. Server is built on Node and Express. There are two APIs which are consumed:

- Official HN API, via Firebase - used to load front page list, story, and comment details
- Algolia HN search results - for the top day and week stories

The server has a simple timer which triggers every 10 minutes to check for updates for the front page. The day and week lists update less frequently. There's additional logic to only reload the comments for a story if enough time has elapsed from the previous update.

The client is a SPA built in React. The bulk of the code is data management and controlling the view when comments are collapsed.

Built in Typescript.

## Self Host

This repo is self contained. The APIs I consume are all publicly accessible. If you want to run this on your own server, simply build the server. This will take care of building the client also and copying the static files to the server. After that, simply `yarn start` from the server directory. There is also a `yarn deploy` script available to copy necessary files to a remote server. You'll need to update the path in `server/package.json`.

```
cd server && yarn build && yarn start
```

## Screenshots

### Mobile

![Mobile screenshot](mobile.png)

### Desktop

![Desktop screenshot](desktop.png)
