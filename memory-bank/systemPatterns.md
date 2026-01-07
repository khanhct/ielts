# System Patterns

## Architecture
- **Frontend**: Next.js App Router with React Server Components and Client Components
- **API**: Next.js API Routes (app/api)
- **AI Integration**: OpenAI GPT-4 via API route

## Key Technical Decisions

### Component Structure
- `app/page.tsx`: Main page with Speaking feature
- `components/SpeakingFeature.tsx`: Main feature component (Client Component)
- `app/api/speaking/route.ts`: API endpoint for OpenAI integration

### Data Flow
1. User submits form → Client Component
2. Client Component → POST to `/api/speaking`
3. API Route → OpenAI API with structured prompt
4. OpenAI → JSON response with answer, vocabulary, structures
5. API Route → Client Component
6. Client Component → Display with highlighting

### Highlighting Strategy
- Vocabulary and structures are highlighted in the answer text using HTML `<mark>` tags
- Separate sections display full lists with Vietnamese translations
- CSS classes distinguish vocabulary (yellow) from structures (blue)

### OpenAI Prompt Engineering
- System message: Sets role as IELTS examiner
- User prompt: Includes question, part, bands, and detailed requirements
- Response format: JSON object with structured data
- Temperature: 0.7 for balanced creativity and consistency

## Design Patterns
- **Client/Server Separation**: Client components for interactivity, API routes for server-side logic
- **CSS Modules**: Scoped styling to prevent conflicts
- **Type Safety**: TypeScript interfaces for request/response types
- **Error Handling**: Try-catch blocks with user-friendly error messages

