import type { Request, Response } from 'express';

// The web app reaches the API through its own domain (Vercel rewrite), so the session
// lives in an HttpOnly cookie that page scripts cannot read. The admin app keeps Bearer.
export const SESSION_COOKIE = 'priceteka_session';

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE && rest.length) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
}
