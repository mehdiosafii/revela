import app from "./app";

// Custom Node <-> fetch bridge for Vercel serverless.
// Vercel's Node runtime pre-consumes the request body (req.body helper),
// so generic adapters that re-read the raw stream hang forever.
// This handler uses the pre-parsed body when present, streams otherwise.
export default async function handler(req: any, res: any) {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(", "));
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      headers.delete("content-length");
    } else {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      body = Buffer.concat(chunks).toString("utf8");
    }
  }

  const response = await app.fetch(new Request(url, { method: req.method, headers, body }));
  res.statusCode = response.status;
  response.headers.forEach((v: string, k: string) => res.setHeader(k, v));
  res.end(Buffer.from(await response.arrayBuffer()));
}
