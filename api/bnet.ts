/** Vercel serverless function: /api/bnet — proxies the Battle.net API with server-held credentials. */
import { bnetHandler } from '../server/bnet';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = Object.fromEntries(url.searchParams.entries());
  const result = await bnetHandler(q, { id: req.headers.get('x-bnet-id') || process.env.BNET_CLIENT_ID, secret: req.headers.get('x-bnet-secret') || process.env.BNET_CLIENT_SECRET });
  return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=60' } });
}
