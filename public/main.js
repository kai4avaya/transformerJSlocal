import * as transformers from '/transformers/package/dist/transformers.js';

let textChunks = [];
let embeddings = [];
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
            const words = line.split(/\s+/);
            words.forEach(word => {
                if (currentSize + word.length + 1 > this.interval) {
                    result.push(currentChunk.join(' '));
                    currentChunk = currentChunk.slice(-this.overlap);
                    currentSize = currentChunk.join(' ').length + 1;
                }
                currentChunk.push(word);
                currentSize += word.length + 1;
            });
        });

        if (currentChunk.length > 0) {
            result.push(currentChunk.join(' '));
        }

        return this.removeDuplicates(result);
    }

    removeDuplicates(chunks) {
        const uniqueChunks = [];
        const seenContent = new Set();

        for (const chunk of chunks) {
            // Create a "fingerprint" of the chunk by keeping only the first 50 characters
            const fingerprint = chunk.trim().slice(0, 50);
            
            if (!seenContent.has(fingerprint)) {
                uniqueChunks.push(chunk);
                seenContent.add(fingerprint);
            }
        }

        return uniqueChunks;
    }
}

// Usage example
// const splitter = new CustomTextSplitter(100, 10);  // Reduced overlap
// const textChunks = splitter.split(inputText);

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

const worker = new Worker('embedding-worker.js', { type: 'module' });

worker.onmessage = function(e) {
    if (e.data.type === 'progress') {
        updateProgress(e.data.progress);
    } else if (e.data.type === 'result') {
        embeddings = e.data.embeddings;
        document.getElementById('output').innerHTML = `Text split into ${textChunks.length} chunks. Embeddings created successfully.`;
        document.getElementById('search-section').style.display = 'block';
        document.getElementById('progress-container').style.display = 'none';
    }
};

function updateProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress.toFixed(0)}%`;
}

async function processText() {
    const inputText = document.getElementById('input-text').value;
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = 'Processing...';
    document.getElementById('progress-container').style.display = 'block';
    updateProgress(0);

    const splitter = new CustomTextSplitter(100, 20);
    textChunks = splitter.split(inputText);

    worker.postMessage({ type: 'process', chunks: textChunks });
}

async function searchEmbeddings() {
    const query = document.getElementById('search-query').value;
    const topK = parseInt(document.getElementById('top-k').value);
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = 'Searching...';

    try {
        worker.postMessage({ type: 'search', query: query });
        worker.onmessage = function(e) {
            if (e.data.type === 'searchResult') {
                const queryEmbedding = e.data.queryEmbedding;
                const similarities = embeddings.map((emb, index) => ({
                    index,
                    similarity: cosineSimilarity(queryEmbedding, emb)
                }));

                similarities.sort((a, b) => b.similarity - a.similarity);
                const topResults = similarities.slice(0, topK);

                let resultHtml = '<h3>Top Results:</h3>';
                topResults.forEach(result => {
                    resultHtml += `<p><strong>Similarity: ${result.similarity.toFixed(4)}</strong><br>${textChunks[result.index]}</p>`;
                });

                resultsDiv.innerHTML = resultHtml;
            }
        };
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        console.error('Error searching embeddings:', error);
    }
}

// Add event listeners
document.getElementById('process-button').addEventListener('click', processText);
document.getElementById('search-button').addEventListener('click', searchEmbeddings);