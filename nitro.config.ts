export default {
  routeRules: {
    // Always revalidate the service worker so new versions install.
    "/sw.js": {
      headers: {
        "Cache-Control": "no-cache",
      },
    },

    "/_build/**": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },

    "/day": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/day/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/week": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/week/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/month": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/month/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/offline": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/offline/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },

    "/story/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  },
};
