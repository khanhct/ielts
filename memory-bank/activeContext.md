# Active Context

## Current Work Focus
**Speaking Feature Implementation** - Initial feature for IELTS Speaking practice

## Recent Changes
- ✅ Set up Next.js 14 project with TypeScript
- ✅ Created Speaking feature UI component
- ✅ Implemented API route with OpenAI integration
- ✅ Added vocabulary and structure highlighting
- ✅ Created responsive, modern UI design
- ✅ Added error handling and loading states
- ✅ Implemented Lesson feature with SQLite storage
- ✅ Added Markdown rendering for lessons
- ✅ Added functionality to update existing lessons

## Implementation Details

### Lesson Feature
- **Storage**: SQLite database (`ielts.db`) using `better-sqlite3`
- **Frontend**: `LessonFeature.tsx` component with form, list view, and update capabilities
- **API**: `/api/lessons` for GET, POST, and PUT operations
- **Rendering**: `react-markdown` for lesson content display

### Speaking Feature Component
- Form with three inputs: Question (textarea), Part (select), Bands (multi-select buttons)
- Real-time band selection toggle
- Form validation before submission
- Loading state during API call
- Error display for user feedback

### API Route (`/api/speaking`)
- Validates input (question, part, bands)
- Constructs detailed prompt for OpenAI
- Requests JSON response format
- Parses and validates response structure
- Returns structured data: answer, vocabulary array, structures array

### Highlighting System
- Regex-based text matching for vocabulary and structures
- HTML `<mark>` tags with CSS classes
- Separate display sections for vocabulary and structures
- Format: "English: Vietnamese" for both lists

## Next Steps
- Test with various questions and band combinations
- Consider adding more IELTS features (Writing, Reading, Listening)
- Potential improvements:
  - Save/export answers
  - History of previous questions
  - Audio playback for pronunciation
  - More detailed feedback

## Important Patterns
- Client components for interactivity (`'use client'`)
- API routes for server-side operations
- CSS Modules for component styling
- TypeScript interfaces for type safety
- Error boundaries and user-friendly messages

## Learnings
- OpenAI GPT-4 provides high-quality IELTS-appropriate answers
- JSON response format ensures structured data
- Highlighting requires careful regex to avoid partial matches
- Multiple band selection allows flexible practice

