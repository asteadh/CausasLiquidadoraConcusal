const OS_PATTERNS: Array<[RegExp, string]> = [
  [/windows/i, "Windows"],
  [/mac os/i, "macOS"],
  [/android/i, "Android"],
  [/(iphone|ipad|ipod)/i, "iOS"],
  [/linux/i, "Linux"],
];

const BROWSER_PATTERNS: Array<[RegExp, string]> = [
  [/edg\//i, "Edge"],
  [/chrome\//i, "Chrome"],
  [/firefox\//i, "Firefox"],
  [/safari\//i, "Safari"],
];

export function parseUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) {
    return { os: "Unknown", browser: "Unknown", label: "Unknown device" };
  }

  const os = OS_PATTERNS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Unknown OS";
  const browser =
    BROWSER_PATTERNS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Unknown browser";

  return { os, browser, label: `${browser} on ${os}` };
}
