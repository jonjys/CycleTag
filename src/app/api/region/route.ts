import { marketForCountry, marketForLanguage } from "@/lib/region";
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const language = request.headers.get("accept-language")?.split(",")[0]?.split(";")[0] ?? "";
  return Response.json({ market: country ? marketForCountry(country) : marketForLanguage(language) }, { headers: { "Cache-Control": "private, no-store" } });
}
