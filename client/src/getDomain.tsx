export function getDomain(url: string | undefined) {
  if (url === undefined) {
    return "";
  }
  const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
  const domain = matches && matches[1];
  return domain;
}
