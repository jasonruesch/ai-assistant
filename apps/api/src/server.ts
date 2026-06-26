import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { env } from '~/env.ts';
import { HttpError } from '~/lib/http.ts';
import { chatRoutes } from '~/rest/chat.ts';

/**
 * Build the fully-wired Fastify app. Exported (rather than started) so tests can
 * drive it with `app.inject()` without binding a port.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal server error' });
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.register(chatRoutes);

  // In production the API also serves the built SPA from a single origin.
  if (env.WEB_DIST && existsSync(env.WEB_DIST)) {
    await app.register(fastifyStatic, { root: env.WEB_DIST });
    app.setNotFoundHandler((request, reply) => {
      // Unknown API paths are real 404s; everything else is a client route, so
      // hand back index.html and let the SPA router resolve it.
      if (request.method !== 'GET' || request.url.startsWith('/api')) {
        return reply.code(404).send({ message: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
