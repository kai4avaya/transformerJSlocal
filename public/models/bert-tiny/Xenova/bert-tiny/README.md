---
library_name: transformers.js
---

https://huggingface.co/YituTech/conv-bert-small with ONNX weights to be compatible with Transformers.js.

## Usage (Transformers.js)

If you haven't already, you can install the [Transformers.js](https://huggingface.co/docs/transformers.js) JavaScript library from [NPM](https://www.npmjs.com/package/@xenova/transformers) using:
```bash
npm i @xenova/transformers
```

**Example:** Feature extraction w/ `Xenova/conv-bert-small`.

```javascript
import { pipeline } from '@xenova/transformers';

// Create feature extraction pipeline
const extractor = await pipeline('feature-extraction', 'Xenova/conv-bert-small');

// Perform feature extraction
const output = await extractor('This is a test sentence.');
console.log(output)
// Tensor {
//   dims: [ 1, 8, 256 ],
//   type: 'float32',
//   data: Float32Array(2048) [ -0.09434918314218521, 0.5715903043746948, ... ],
//   size: 2048
// }
```

---


Note: Having a separate repo for ONNX weights is intended to be a temporary solution until WebML gains more traction. If you would like to make your models web-ready, we recommend converting to ONNX using [🤗 Optimum](https://huggingface.co/docs/optimum/index) and structuring your repo like this one (with ONNX weights located in a subfolder named `onnx`).