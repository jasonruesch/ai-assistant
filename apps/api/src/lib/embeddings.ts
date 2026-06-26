import { env } from '~/env.ts';

/**
 * Embeddings live behind a tiny interface so the provider is swappable. Claude
 * has no embeddings endpoint, so retrieval uses Voyage AI (Anthropic's
 * documented recommendation) by default. To swap in a local model or a
 * different API, implement `EmbeddingProvider` and return it from
 * `getEmbeddingProvider()`.
 */

/** Voyage distinguishes corpus passages ("document") from search text ("query"). */
export type EmbeddingInputType = 'document' | 'query';

export interface EmbeddingProvider {
  /** Embedding dimensionality — must match the `vector(N)` column. */
  readonly dimensions: number;
  embed(texts: string[], inputType: EmbeddingInputType): Promise<number[][]>;
}

const VOYAGE_MODEL = 'voyage-3';
const VOYAGE_DIMENSIONS = 1024;
const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';

class VoyageEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = VOYAGE_DIMENSIONS;

  constructor(private readonly apiKey: string) {}

  async embed(
    texts: string[],
    inputType: EmbeddingInputType,
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: texts,
        input_type: inputType,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Voyage embeddings request failed (${response.status}): ${detail}`,
      );
    }

    const json = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
    };
    // Voyage returns results keyed by index — sort to preserve input order.
    return json.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}

let cached: EmbeddingProvider | null = null;

/**
 * Resolve the configured embedding provider. Throws a clear error if the key is
 * missing — this is called lazily (at retrieval / seed time), never at boot, so
 * the server and its tests can start without a key.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  if (!env.VOYAGE_API_KEY) {
    throw new Error(
      'VOYAGE_API_KEY is not set — required for knowledge-base retrieval. ' +
        'Set it in apps/api/.env (see .env.example).',
    );
  }
  cached = new VoyageEmbeddingProvider(env.VOYAGE_API_KEY);
  return cached;
}

/** Test seam: inject a fake provider (e.g. deterministic vectors). */
export function setEmbeddingProvider(provider: EmbeddingProvider | null): void {
  cached = provider;
}
