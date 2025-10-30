export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

/**
 * Check if token is expired or will expire soon.
 * Assumes JWT format: header.payload.signature
 */
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000; // convert seconds → ms
    return Date.now() > exp;
  } catch {
    return true; // Treat invalid token as expired
  }
}
