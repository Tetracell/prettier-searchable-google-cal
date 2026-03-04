import { next } from "@vercel/edge";

export default function middleware(req) {
  return next({
    headers: {
      "Referrer-Policy": "origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self' https://www.derbynecklibrary.org",
      "X-Content-Type-Options": "nosniff",
      "X-DNS-Prefetch-Control": "on",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
    },
  });
}
