<div align="center">
  <h3 align="center">Seed-CAT</h3>

  <p align="center">
    A computer-aided translation tool designed for expanding the Seed dataset and training machine translation models.
    <br />
    <br />
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#license">License</a>
    ·
    <a href="#acknowledgements">Acknowledgements</a>
  </p>
</div>

## Getting Started

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Prerequisites

* [Node.js](https://nodejs.org/en/download/package-manager/)
* [Python](https://www.python.org/downloads/)
* [Graphviz](https://graphviz.org/download/) (optional) for creating provenance graphs of translation entities.

### Installation

1. Clone the repository:
   ```sh
   https://github.com/josecols/seed-cat.git
   cd seed-cat/seed-cat
   ```
   
2. Install NPM packages:
    ```sh
    npm install
    ```

## Usage

First, run the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To run the provenance graph server, install the Python dependencies and run the server:

```sh
cd graph
pip install -r requirements.txt
```

```bash
python main.py
```

## Configuration

The application can be configured with the following environment variables:

* `GCS_BUCKET`: The name of the Google Cloud Storage bucket used for automatic backups.
* `GITHUB_TOKEN`: A token that increases the rate limits for GitHub API requests. This can be particularly useful during local development or testing.
* `GOOGLE_APPLICATION_CREDENTIALS`: The Service Account [JSON key file](https://cloud.google.com/iam/docs/keys-create-delete), encoded in `base64` format. This credential allows access to Google Cloud Storage for automatic backups.
* `HUGGINGFACE_TOKEN`: A user access token for the [Serverless Inference API](https://huggingface.co/docs/api-inference/en/index). If not provided, the application will default to using local inference with [`Transformers.js`](https://github.com/xenova/transformers.js).

## License

This project is licensed under [CC-BY-SA-4.0](https://github.com/josecols/seed-cat/blob/main/LICENSE).

This project also distributes a copy of the WordNet 3.1 database; please refer to the [WordNet License](data/wordnet/LICENSE). 

## Acknowledgements

This software is built on top of other open-source projects, including: [Transformers.js](https://github.com/xenova/transformers.js), [natural](https://github.com/NaturalNode/natural), [React](https://github.com/facebook/react), [Headless UI](https://github.com/tailwindlabs/headlessui), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [heroicons](https://github.com/tailwindlabs/heroicons).
