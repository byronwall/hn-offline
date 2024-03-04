export function ensureUrlIsFullyQualified(url: string) {
  const publicPrefix = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!url.startsWith(publicPrefix)) {
    url = publicPrefix + url;
  }
  return url;
}
