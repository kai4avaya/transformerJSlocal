// paraphrase-albert-embedding.js

import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { pipeline, env } from '@xenova/transformers';

// Load environment variables
dotenv.config();

// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
env.localModelPath = path.join(__dirname, 'public', 'models');
// CustomTextSplitter class (unchanged)
class CustomTextSplitter {
  constructor(interval, overlap, charToSplit = '\n\n') {
      this.interval = interval;
      this.overlap = overlap;
      this.charToSplit = charToSplit;
  }

  split(text) {
      const result = [];
      const lines = text.split(this.charToSplit);

      let currentChunk = [];
      let currentSize = 0;

      lines.forEach(line => {
          const tokens = line.match(/\w+|[^\w\s]+/g) || [];
          tokens.forEach(token => {
              if (currentSize + token.length + 1 > this.interval) {
                  result.push(currentChunk.join(' '));
                  currentChunk = currentChunk.slice(-this.overlap);
                  currentSize = currentChunk.join(' ').length + 1;
              }
              currentChunk.push(token);
              currentSize += token.length + 1;
          });
      });

      if (currentChunk.length > 0) {
          result.push(currentChunk.join(' '));
      }

      return result;
  }
}

// Function to compute cosine similarity (unchanged)

// Function to tokenize text (simplified)
function tokenize(text, vocab) {
  return text.toLowerCase().split(/\s+/).map(token => vocab[token] || vocab['[UNK]']);
}

// Function to perform mean pooling
function meanPooling(tensorData, shape) {
  const [batchSize, seqLength, hiddenSize] = shape;
  const result = new Array(batchSize).fill(0).map(() => new Array(hiddenSize).fill(0));

  for (let b = 0; b < batchSize; b++) {
    for (let s = 0; s < seqLength; s++) {
      for (let h = 0; h < hiddenSize; h++) {
        result[b][h] += tensorData[b * seqLength * hiddenSize + s * hiddenSize + h];
      }
    }
  }

  for (let b = 0; b < batchSize; b++) {
    for (let h = 0; h < hiddenSize; h++) {
      result[b][h] /= seqLength;
    }
  }

  return result;
}

// Function to compute cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}


// Main function
async function main() {
    // Initialize the feature extraction pipeline
    console.log('Loading the feature extraction pipeline...');
    const modelPath = path.join(__dirname, 'public', 'models', 'allminilm-l6-v2');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      revision: 'default',
      quantized: false,
  });
    console.log('Feature extraction pipeline loaded.');

  // Function to create embeddings using conv-bert-small
  async function createEmbeddings(texts) {
    const output = await extractor(texts, { pooling: 'mean', precision: "binary" });
    return Array.isArray(output) ? output.map(tensor => Array.from(tensor.data)) : [Array.from(output.data)];
}

// Fetch and extract text from website
const websiteURL = 'https://en.wikipedia.org/wiki/Artificial_intelligence';
console.log(`Fetching and extracting text from ${websiteURL}...`);
const response = await fetch(websiteURL);
const html = await response.text();
const $ = cheerio.load(html);
const websiteText = $('body').text().replace(/\s+/g, ' ').trim();
console.log('Text extraction complete.');

// Split the text into chunks
const textSplitter = new CustomTextSplitter(300, 50);
const textChunks = textSplitter.split(websiteText);
console.log(`Text split into ${textChunks.length} chunks.`);

// Create embeddings for all chunks with progress logging
console.log('Creating embeddings for all chunks...');
const embeddings = [];
const totalChunks = textChunks.length;
const batchSize = 32; // Reduced batch size
const totalBatches = Math.ceil(totalChunks / batchSize);

console.time('Embedding Creation');
for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * batchSize;
    const batchEnd = Math.min((i + 1) * batchSize, totalChunks);
    const batchChunks = textChunks.slice(batchStart, batchEnd);
    
    const batchEmbeddings = await createEmbeddings(batchChunks);
    embeddings.push(...batchEmbeddings);

    // Log progress
    const progress = ((i + 1) / totalBatches * 100).toFixed(2);
    console.log(`Progress: ${progress}% (${batchEnd}/${totalChunks} chunks processed)`);
}
console.timeEnd('Embedding Creation');
console.log('All embeddings created.');

// Example query
const queryText = 'what are the goals of ai?';
console.log(`Creating embedding for query: "${queryText}"`);
const [queryEmbedding] = await createEmbeddings([queryText]);

// Compute similarities and rank chunks
console.log('Ranking chunks based on similarity...');
const rankedChunks = textChunks.map((chunk, index) => ({
    text: chunk,
    similarity: cosineSimilarity(queryEmbedding, embeddings[index])
})).sort((a, b) => b.similarity - a.similarity);

// Print top k matches
const k = 5;
console.log(`Top ${k} matching chunks:`);
rankedChunks.slice(0, k).forEach((chunk, index) => {
    console.log(`\nRank ${index + 1} (Similarity: ${chunk.similarity.toFixed(4)}):`);
    console.log(chunk.text);
});
}

main().catch(console.error);