# Technical Context

## Technologies Used
- **Next.js 14.2.5**: React framework with App Router
- **React 18.3.1**: UI library
- **TypeScript 5.5.3**: Type safety
- **OpenAI SDK 4.52.0**: Official OpenAI API client
- **better-sqlite3**: High-performance SQLite3 library for Node.js
- **react-markdown**: Markdown rendering component
- **lucide-react**: Icon library

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Installation
```bash
npm install
```

### Environment Variables
Create `.env.local`:
```
OPENAI_API_KEY=your_key_here
```

### Development Commands
- `npm run dev`: Start development server (port 3000)
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Project Structure
```
ielts/
├── app/
│   ├── api/
│   │   └── speaking/
│   │       └── route.ts      # API endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── SpeakingFeature.tsx   # Main feature component
│   └── SpeakingFeature.module.css
├── memory-bank/              # Documentation
├── package.json
├── tsconfig.json
└── next.config.js
```

## Dependencies
- **next**: Framework
- **react/react-dom**: UI library
- **openai**: OpenAI API client
- **typescript**: Type checking
- **@types/node, @types/react, @types/react-dom**: Type definitions

## Technical Constraints
- Requires OpenAI API key (paid service)
- GPT-4 model used (more expensive but higher quality)
- Response format must be JSON for parsing

## API Configuration
- Model: `gpt-4`
- Temperature: `0.7`
- Response format: `json_object`
- System role: IELTS examiner expert

