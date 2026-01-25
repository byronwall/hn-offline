// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { mount, StartClient } from "@solidjs/start/client";

mount(
  () => (
    <MetaProvider>
      <StartClient />
    </MetaProvider>
  ),
  document.getElementById("app")!
);
