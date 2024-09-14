// download-model.cjs
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const { config } = await import('dotenv');
  config();

  const fetch = (await import('node-fetch')).default;

  const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

  if (!HUGGING_FACE_TOKEN) {
    console.error('Error: HUGGING_FACE_TOKEN environment variable is not set.');
    process.exit(1);
  }

  async function downloadFile(url, outputPath) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(buffer));
    console.log(`Downloaded ${url}`);
  }

  async function downloadModel(modelId, localPath) {
    const apiUrl = `https://huggingface.co/api/models/${modelId}`;
    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch model info: ${response.statusText}`);
      }

      const data = await response.json();

      const files = data.siblings.map((file) => file.rfilename);

      for (const file of files) {
        const url = `https://huggingface.co/${modelId}/resolve/main/${file}`;
        const outputPath = path.join(localPath, file);
        try {
          await downloadFile(url, outputPath);
        } catch (error) {
          console.error(`Failed to download ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch model files:`, error.message);
    }
  }

  const modelId = 'Xenova/all-MiniLM-L6-v2';
  const localPath = path.join(__dirname, 'public', 'models', 'allminilm-l6-v2');
  await downloadModel(modelId, localPath);
}

main().catch(console.error);