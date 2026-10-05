export function safeReturnUrl(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value) ||
    value.startsWith('/auth') ||
    value.startsWith('/api')
  )
    return '/dashboard/account';
  try {
    const url = new URL(value, 'http://imet.local');
    const decodedPath = decodeURIComponent(url.pathname);
    const normalizedPath = new URL(decodedPath, 'http://imet.local').pathname;
    if (
      decodedPath.startsWith('//') ||
      /[\\\r\n]/.test(decodedPath) ||
      normalizedPath.startsWith('/auth') ||
      normalizedPath.startsWith('/api')
    )
      return '/dashboard/account';
    return url.origin === 'http://imet.local'
      ? `${url.pathname}${url.search}${url.hash}`
      : '/dashboard/account';
  } catch {
    return '/dashboard/account';
  }
}
