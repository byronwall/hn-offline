export default {
  routeRules: {
    "/_build/sw.js": {
      headers: {
        "Service-Worker-Allowed": "/",
        "Cache-Control": "no-cache",
      },
    },

    "/_build/**": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  },
};
