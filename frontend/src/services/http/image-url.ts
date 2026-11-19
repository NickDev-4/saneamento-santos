export function resolveApiImageUrl(imageUrl: string, apiBaseUrl: string, origin?: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(imageUrl)) return imageUrl;
  const resolvedOrigin =
    origin ?? (typeof window === 'undefined' ? undefined : window.location.origin);
  if (!resolvedOrigin) return imageUrl;
  const apiBase = new URL(apiBaseUrl, resolvedOrigin);
  const apiPath = apiBase.pathname.replace(/\/$/, '');
  if (apiPath && imageUrl.startsWith(`${apiPath}/`))
    return new URL(imageUrl, apiBase.origin).toString();
  if (imageUrl.startsWith('/')) return new URL(imageUrl, resolvedOrigin).toString();
  return new URL(imageUrl, `${apiBase.href.replace(/\/$/, '')}/`).toString();
}
