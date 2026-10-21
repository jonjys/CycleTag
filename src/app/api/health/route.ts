export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "ok", service: "staytag", storage: "optional-shared-moves" }, { headers: { "Cache-Control": "public, max-age=300" } });
}
