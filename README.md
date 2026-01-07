# IELTS Assistant

An OpenAI-based Next.js application to assist with IELTS exam preparation, starting with the Speaking feature.

## Features

### Speaking Feature
- **Input:**
  - Question: Enter your IELTS speaking question
  - Part: Select Part 1, 2, or 3
  - Band Selections: Multiple choice selection for Band 7, 8, or 9

- **Output:**
  - High-quality answer in English with highlighted vocabulary and structures
  - Vocabulary list with English terms and Vietnamese meanings
  - Structure list with English grammatical structures and Vietnamese explanations

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

1. Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. The application will be available at [http://localhost:3000](http://localhost:3000)

### Docker Commands

- Build and start: `docker-compose up -d`
- Stop: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild: `docker-compose up -d --build`

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- OpenAI API
- CSS Modules
- Docker
