import { defineConfig, loadEnv, type Plugin } from 'vite';
import { bnetHandler } from './server/bnet';

/** Dev-server middleware: /api/bnet proxies the Battle.net API using creds from .env.local (or request headers). */
function bnetDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'geekos-bnet-proxy',
    configureServer(server) {
      server.middlewares.use('/api/bnet', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const q = Object.fromEntries(url.searchParams.entries());
        const result = await bnetHandler(q, { id: (req.headers['x-bnet-id'] as string) || env.BNET_CLIENT_ID, secret: (req.headers['x-bnet-secret'] as string) || env.BNET_CLIENT_SECRET });
        res.statusCode = result.status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result.body));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [bnetDevProxy(env)],
    build: { outDir: 'dist', target: 'es2020', sourcemap: false },
    server: { port: 5173, strictPort: false },
  };
});
