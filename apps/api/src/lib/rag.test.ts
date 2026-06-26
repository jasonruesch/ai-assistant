import { describe, expect, it } from 'vitest';
import { chunkText, formatSourcesForModel } from '~/lib/rag.ts';

describe('chunkText', () => {
  it('packs short paragraphs into a single chunk', () => {
    const text = 'Para one.\n\nPara two.\n\nPara three.';
    expect(chunkText(text)).toEqual(['Para one.\n\nPara two.\n\nPara three.']);
  });

  it('splits when the character budget is exceeded', () => {
    const para = 'x'.repeat(500);
    const chunks = chunkText(`${para}\n\n${para}\n\n${para}`, {
      maxChars: 600,
    });
    expect(chunks.length).toBeGreaterThan(1);
    // Every chunk stays within a reasonable bound (budget + overlap).
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(900);
    }
  });

  it('ignores blank input', () => {
    expect(chunkText('   \n\n   ')).toEqual([]);
  });
});

describe('formatSourcesForModel', () => {
  it('numbers sources for citation', () => {
    const out = formatSourcesForModel([
      { id: '1', title: 'Doc A', snippet: 'alpha', score: 0.9 },
      {
        id: '2',
        title: 'Doc B',
        url: 'https://example.com',
        snippet: 'beta',
        score: 0.8,
      },
    ]);
    expect(out).toContain('[1] Doc A');
    expect(out).toContain('[2] Doc B (https://example.com)');
  });

  it('reports when nothing was found', () => {
    expect(formatSourcesForModel([])).toMatch(/no relevant passages/i);
  });
});
