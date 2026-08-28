export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "ok", service: "cycletag", storage: "none", secrets: "none" }, { headers: { "Cache-Control": "public, max-age=300" } });
}
