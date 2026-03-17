import type { Response } from "express";

export const ACCESS_COOKIE_NAME = "skuully_access_token";
export const REFRESH_COOKIE_NAME = "skuully_refresh_token";
export const CSRF_COOKIE_NAME = "skuully_csrf_token";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CSRF_MAX_AGE_MS = REFRESH_MAX_AGE_MS;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function resolveCookieDomain() {
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
    domain: resolveCookieDomain(),
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/auth",
    maxAge: REFRESH_MAX_AGE_MS,
    domain: resolveCookieDomain(),
  });
}

export function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_MAX_AGE_MS,
    domain: resolveCookieDomain(),
  });
}

export function clearAuthCookies(res: Response) {
  const base = {
    secure: isProduction(),
    sameSite: "lax" as const,
    domain: resolveCookieDomain(),
  };

  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...base,
    httpOnly: true,
    path: "/",
  });

  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...base,
    httpOnly: true,
    path: "/auth",
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    ...base,
    httpOnly: false,
    path: "/",
  });
}