import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.OPENCLAW_GATEWAY_URL ?? "http://localhost:63362";

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const qs = req.nextUrl.search || "";
  const url = `${BASE}/${path}${qs}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" ? undefined : await req.text()
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" }
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
