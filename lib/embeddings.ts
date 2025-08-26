export async function generateEmbeddings(
  text: string,
  config?: EmbeddingConfig
): Promise<number[]> {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    embedding[idx % 384] = Math.sin(hash) * 0.5 + 0.5;
  });
  return embedding;
}

export async function generateChunkEmbeddings(
  chunks: EmbeddingChunk[]
): Promise<EmbeddingChunk[]> {
  return Promise.all(
    chunks.map(async (chunk) => ({
      ...chunk,
      embedding: await generateEmbeddings(chunk.content)
    }))
  );
}