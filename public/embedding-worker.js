import * as transformers from '/transformers/package/dist/transformers.js';

// Check available threads and set to max possible
const maxThreads = navigator.hardwareConcurrency || 1;
console.log(`Using ${maxThreads} thread(s) for ONNX WASM runtime`);

// Configure the environment
transformers.env.backends.onnx.wasm.wasmPaths = '/transformers/package/dist/';
transformers.env.backends.onnx.wasm.numThreads = maxThreads;
transformers.env.localModelPath = '/models/bert-tiny/';
transformers.env.allowRemoteModels = false;

let extractor;

async function initializePipeline() {
    try {
        extractor = await transformers.pipeline('feature-extraction', 'Xenova/bert-tiny', {
            quantized: true,
            revision: 'default',
            backend: 'webgl'
        });
        console.log('Pipeline initialized with WebGL');
    } catch (error) {
        console.error('Error initializing pipeline:', error);
    }
}

async function createEmbeddings(texts) {
    try {
        const output = await extractor(texts, { 
            pooling: 'mean', 
            normalize: true
        });
        return Array.isArray(output) ? output.map(tensor => Array.from(tensor.data)) : [Array.from(output.data)];
    } catch (error) {
        console.error('Error creating embeddings:', error);
        throw error;
    }
}

initializePipeline();

self.onmessage = async function(e) {
    if (e.data.type === 'process') {
        const chunks = e.data.chunks;
        const embeddings = [];
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await createEmbeddings([chunks[i]]);
            embeddings.push(embedding[0]);
            const progress = ((i + 1) / chunks.length) * 100;
            self.postMessage({ type: 'progress', progress: progress });
        }
        self.postMessage({ type: 'result', embeddings: embeddings });
    } else if (e.data.type === 'search') {
        const queryEmbedding = await createEmbeddings([e.data.query]);
        self.postMessage({ type: 'searchResult', queryEmbedding: queryEmbedding[0] });
    }
};