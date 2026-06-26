import type { Source } from '@sourcesage/shared';
import { prisma } from '~/db.ts';
import { getEmbeddingProvider } from '~/lib/embeddings.ts';

/**
 * Split a document into overlapping chunks suitable for embedding. Splits on
 * blank lines (paragraph/heading boundaries), then packs paragraphs up to a
 * character budget so each chunk is a coherent passage. A small overlap keeps
 * context across boundaries.
 */
export function chunkText(
  text: string,
  {
    maxChars = 900,
    overlapChars = 150,
  }: { maxChars?: number; overlapChars?: number } = {},
): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > maxChars) {
      chunks.push(current);
      // Carry a tail of the previous chunk forward as overlap.
      current = current.slice(-overlapChars) + '\n\n' + para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Format an embedding as a pgvector literal: `[0.1,0.2,…]`. */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

interface ChunkRow {
  id: string;
  content: string;
  title: string;
  url: string | null;
  score: number;
}

/**
 * Embed the query and return the top-k most similar corpus chunks via a
 * pgvector cosine-similarity search (`<=>` is cosine distance; similarity is
 * `1 - distance`). Returns `Source[]` ready to stream to the UI as citations.
 */
export async function searchKnowledgeBase(
  query: string,
  topK = 4,
): Promise<Source[]> {
  const provider = getEmbeddingProvider();
  const [embedding] = await provider.embed([query], 'query');
  if (!embedding) return [];

  const vector = toVectorLiteral(embedding);
  const rows = await prisma.$queryRaw<ChunkRow[]>`
    SELECT c."id",
           c."content",
           d."title",
           d."url",
           1 - (c."embedding" <=> ${vector}::vector) AS score
    FROM "chunks" c
    JOIN "documents" d ON d."id" = c."documentId"
    WHERE c."embedding" IS NOT NULL
    ORDER BY c."embedding" <=> ${vector}::vector
    LIMIT ${topK}
  `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url ?? undefined,
    snippet: row.content,
    // Postgres returns the computed score as a string/number depending on driver.
    score: Number(row.score),
  }));
}

/** Render retrieved passages as the text block returned to the model. */
export function formatSourcesForModel(sources: Source[]): string {
  if (sources.length === 0) {
    return 'No relevant passages were found in the knowledge base.';
  }
  return sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}${s.url ? ` (${s.url})` : ''}\n${s.snippet}`,
    )
    .join('\n\n');
}
