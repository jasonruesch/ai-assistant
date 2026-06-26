import {
  type ChatMessage,
  type ConversationDetail,
  type StreamEvent,
  chatRequestSchema,
} from '@sourcesage/shared';
import type { FastifyInstance } from 'fastify';
import { runChat } from '~/chat/stream.ts';
import { prisma } from '~/db.ts';
import { HttpError } from '~/lib/http.ts';

/** Derive a short conversation title from the first user message. */
function titleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
}

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/chat — stream a chat turn as Server-Sent Events.
   * Body: { message, conversationId? }. Emits start → (thinking|text|tool_*)…
   * → done, or a terminal error event.
   */
  app.post('/api/chat', async (request, reply) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? 'Invalid request',
      );
    }
    const { message, conversationId } = parsed.data;

    // Resolve (or create) the conversation.
    let conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;
    const isNew = !conversation;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { title: titleFromMessage(message) },
      });
    }

    // Build the model history from prior turns + the new user message.
    const prior = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    const history: ChatMessage[] = [
      ...prior.map((m) => ({
        role: m.role as ChatMessage['role'],
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Persist the user message before streaming.
    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    // Take over the socket for SSE.
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering so frames flush immediately.
      'X-Accel-Buffering': 'no',
    });

    const send = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    send({ type: 'start', conversationId: conversation.id });

    try {
      const { assistantText, usage } = await runChat(history, send);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: assistantText,
        },
      });
      if (isNew) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { title: titleFromMessage(message) },
        });
      }

      send({ type: 'done', usage });
    } catch (error) {
      app.log.error(error);
      const messageText =
        error instanceof Error
          ? error.message
          : 'The assistant failed to respond.';
      send({ type: 'error', message: messageText });
    } finally {
      res.end();
    }
  });

  /** GET /api/conversations/:id — full message history for a conversation. */
  app.get<{ Params: { id: string } }>(
    '/api/conversations/:id',
    async (request) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: request.params.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conversation) throw new HttpError(404, 'Conversation not found');

      const detail: ConversationDetail = {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map((m) => ({
          role: m.role as ChatMessage['role'],
          content: m.content,
        })),
      };
      return detail;
    },
  );
}
