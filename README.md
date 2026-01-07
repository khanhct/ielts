# IELTS Assistant

An OpenAI-based Next.js application to assist with IELTS exam preparation.

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

### Writing Feature
- Generate writing responses for Task 1 (Graph/Chart/Letter) or Task 2 (Essay)
- Support for text and image inputs
- Band-specific responses (7, 8, 9)
- Highlighted vocabulary and structures with Vietnamese translations

### Writing Fix Feature
- Analyze student answers for errors
- Provide band score with explanation
- Identify grammatical errors, typos, and spelling mistakes
- Suggest corrected versions maintaining original meaning

### Vocabulary Learning Feature
- Learn phrases and idioms by topic
- Task-specific content (Speaking or Writing)
- Vietnamese translations and example sentences

### Authentication
- Login system (username: `ieltstester`)
- Protected routes

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

3. The application will be available at [http://localhost:3030](http://localhost:3030)

### Docker Commands

- **Build and start**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **View logs**: `docker-compose logs -f`
- **Rebuild**: `docker-compose up -d --build`
- **Stop and remove volumes**: `docker-compose down -v`

## Login Credentials

- **Username**: `ieltstester`
- **Password**: Any password (for demo purposes)

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- OpenAI API (GPT-4o)
- CSS Modules
- Docker & Docker Compose

## Project Structure

```
ielts/
├── app/
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/           # React components
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker image definition
└── package.json          # Dependencies
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
