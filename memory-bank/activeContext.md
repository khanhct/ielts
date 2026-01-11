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
- ✅ Updated Vocabulary Learn feature to include base verb forms and usage patterns
- ✅ Changed Vocabulary Learn storage to be session-based (per turn) instead of per-word
- ✅ Refined Vocabulary Learn output: Verb Phrases now include both verb patterns and noun collocations; removed separate pattern line in Verb section.
- ✅ Updated Verb section format in Vocabulary Learn to: `verb(v):/pronunciation/ meaning`.
- ✅ Set role for Vocabulary Learn to "IELTS Expert" to provide high-band exam-focused content.
- ✅ Implemented interactive Flashcard Matching Game for Lessons.
- ✅ Added AI-powered vocabulary extraction for lesson games.

## Implementation Details

### Lesson Feature
- **Storage**: SQLite database (`ielts.db`) using `better-sqlite3`
- **Frontend**: `LessonFeature.tsx` component with form, list view, and update capabilities
- **API**: `/api/lessons` for GET, POST, and PUT operations
- **Rendering**: `react-markdown` for lesson content display

### Vocabulary Learn Feature
- **Storage**: `vocal_learning_sessions` table in SQLite
- **Frontend**: `VocabularyLearn.tsx` with detailed breakdown including base verb forms and synonyms
- **API**: `/api/vocabulary-learn` for session-based storage of word breakdowns
- **Logic**: Automatically identifies base verbs and usage patterns for input words (e.g., contribution -> contribute)

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

