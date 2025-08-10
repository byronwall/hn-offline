import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: (event) => {
    console.log("Request received:", event.request.url);

    event.response.headers.set("Service-Worker-Allowed", "/");
  },
});
