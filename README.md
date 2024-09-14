# BERT Model Downloader and Tester

This project provides scripts to download various BERT models and run embedding tests on them.

## File Structure

```
.
├── config.js
├── download-model-albert.js
├── download-model-allmini.js
├── download-model-bert.js
├── download-model-tiny.js
├── embedding-test-albert.js
├── embedding-test-allmini.js
└── embedding-test-tiny.js
```

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Downloading Models

To download a specific model, run the corresponding download script using Node.js:

```bash
node download-model-albert.js
node download-model-allmini.js
node download-model-bert.js
node download-model-tiny.js
```

Each script will download and save the respective model files to a predetermined directory (likely specified in `config.js`).

## Running Embedding Tests

After downloading the models, you can run embedding tests using the following commands:

```bash
node embedding-test-albert.js
node embedding-test-allmini.js
node embedding-test-tiny.js
```

These scripts will load the corresponding model and perform embedding tests, likely outputting the results to the console or a file.

## Configuration

The `config.js` file likely contains shared configuration settings used by both the download and test scripts. You may need to adjust this file if you want to change download locations, model parameters, or test settings.

## Notes

- Ensure you have sufficient disk space before downloading the models, as they can be quite large.
- The download and test processes may take some time, especially for larger models.
- If you encounter any issues, check the console output for error messages and ensure all dependencies are correctly installed.

## Contributing

If you'd like to contribute to this project, please [open an issue](https://github.com/<username>/<repository-name>/issues) or submit a pull request.

## License

[Specify your license here]