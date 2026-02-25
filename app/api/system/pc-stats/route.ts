import { NextResponse } from "next/server";
export async function GET() {
  try {
    const res = await fetch("http://100.72.162.110:3001/api/system/stats", { 
      headers: { "x-api-key": "846ceaee0ea7adbc8a407c3b222e5fb8" }, 
      cache: "no-store" 
    });
    const data = await res.json();
    return NextResponse.json({
      cpu: { usagePercent: data.cpu },
      memory: data.memory,
      disk: data.disk,
      uptimeSeconds: data.uptime,
      gatewayOnline: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
