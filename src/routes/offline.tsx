import { Meta, Title } from "@solidjs/meta";

import Offline from "~/components/offline";

export default function OfflinePage() {
  return (
    <>
      <Title>HN Offline: Offline</Title>
      <Meta name="description" content="Offline shell page" />
      <Offline />
    </>
  );
}
