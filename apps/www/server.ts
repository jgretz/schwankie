import path from 'node:path';

const SERVER_PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIRECTORY = './dist/client';
const SERVER_ENTRY_POINT = './dist/server/server.js';

async function initializeServer() {
  console.log('Starting production server...');

  const serverModule = (await import(SERVER_ENTRY_POINT)) as {
    default: {fetch: (request: Request) => Response | Promise<Response>};
  };
  const handler = serverModule.default;

  const server = Bun.serve({
    port: SERVER_PORT,

    routes: {
      '/*': async (req: Request) => {
        const url = new URL(req.url);
        const file = Bun.file(path.join(CLIENT_DIRECTORY, url.pathname));
        if (await file.exists()) return new Response(file);

        try {
          return handler.fetch(req);
        } catch (error) {
          console.error(`Server handler error: ${String(error)}`);
          return new Response('Internal Server Error', {status: 500});
        }
      },
    },

    error(error) {
      console.error(`Uncaught server error: ${error instanceof Error ? error.message : String(error)}`);
      return new Response('Internal Server Error', {status: 500});
    },
  });

  console.log(`schwankie-www listening on http://localhost:${String(server.port)}`);
}

initializeServer().catch((error: unknown) => {
  console.error(`Failed to start server: ${String(error)}`);
  process.exit(1);
});
