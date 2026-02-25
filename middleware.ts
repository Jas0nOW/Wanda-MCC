import { NextRequest, NextResponse } from "next/server";

const AUTH_USER = "Jas0n";
const AUTH_PASS = "GoogleJannismail1!";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statische Dateien und Assets ignorieren (mit und ohne /mcc Prefix)
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/sw.js") ||
    pathname.includes("/manifest.json") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes("/icon-")
  ) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = Buffer.from(encoded, "base64").toString("utf-8");
        const [user, ...passParts] = decoded.split(":");
        const pass = passParts.join(":");
        if (user === AUTH_USER && pass === AUTH_PASS) {
          return NextResponse.next();
        }
      } catch {}
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=\"MCC\"" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
