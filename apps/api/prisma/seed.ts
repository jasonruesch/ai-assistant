import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/db.ts';
import { getEmbeddingProvider } from '../src/lib/embeddings.ts';
import { chunkText } from '../src/lib/rag.ts';

/**
 * Ingest the markdown corpus into the RAG store: for each file, upsert a
 * Document, (re)chunk it, embed the chunks (Voyage), and insert them with their
 * pgvector embeddings. Idempotent — re-running replaces a document's chunks.
 *
 * Requires VOYAGE_API_KEY. Run with: pnpm --filter @sourcesage/api db:seed
 */

const CORPUS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'corpus');

/** Pull a human title from the first markdown H1, else fall back to the filename. */
function titleFor(filename: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
}

async function seed(): Promise<void> {
  const files = (await readdir(CORPUS_DIR)).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`No markdown files found in ${CORPUS_DIR}`);
    return;
  }

  const provider = getEmbeddingProvider();
  let totalChunks = 0;

  for (const filename of files) {
    const raw = await readFile(join(CORPUS_DIR, filename), 'utf8');
    const title = titleFor(filename, raw);

    // Upsert the document, keyed by its stable source filename.
    const document = await prisma.document.upsert({
      where: { source: filename },
      create: { source: filename, title },
      update: { title },
    });

    // Replace existing chunks so re-seeding is clean.
    await prisma.chunk.deleteMany({ where: { documentId: document.id } });

    const chunks = chunkText(raw);
    const embeddings = await provider.embed(chunks, 'document');

    for (let i = 0; i < chunks.length; i++) {
      const vector = `[${embeddings[i].join(',')}]`;
      // Raw insert: Prisma's typed client can't write the Unsupported vector type.
      await prisma.$executeRaw`
        INSERT INTO "chunks" ("id", "documentId", "index", "content", "embedding", "createdAt")
        VALUES (${randomUUID()}, ${document.id}, ${i}, ${chunks[i]}, ${vector}::vector, now())
      `;
    }

    totalChunks += chunks.length;
    console.log(`Seeded "${title}" — ${chunks.length} chunks`);
  }

  console.log(`Done. ${files.length} documents, ${totalChunks} chunks.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
