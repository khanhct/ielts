# Project Brief

## Overview
IELTS Assistant is an OpenAI-based Next.js application designed to help students prepare for the IELTS exam. The application provides AI-powered assistance for different sections of the IELTS test.

## Core Requirements

### Speaking Feature (Initial Implementation)
- **Input Fields:**
  - Question: Text input for IELTS speaking questions
  - Part: Selection dropdown (Part 1, 2, or 3)
  - Band Selections: Multiple choice selection (Band 7, 8, 9)

- **Output:**
  - High-quality answer in English
  - Highlighted vocabulary and grammatical structures within the answer
  - Separate lists showing:
    - Vocabulary: English term → Vietnamese meaning
    - Structures: English structure → Vietnamese explanation

### Lesson Feature
- **Input Fields:**
  - Name: Title of the lesson
  - Content: Lesson text in Markdown format
- **Functionality:**
  - Create and store lessons in SQLite
  - List available lessons
  - View lesson details with rendered Markdown

### Vocabulary Learning Feature
- **Word-based Learning:**
  - Input: List of words separated by commas
  - Output: Structured breakdown including type, pronunciation, meaning, verb forms, phrases, and synonyms
- **Storage:** Results stored in SQLite for history tracking

## Goals
- Provide accurate, band-appropriate IELTS speaking answers
- Help students learn advanced vocabulary and structures
- Support multiple band levels (7, 8, 9)
- Create an intuitive, modern user interface

## Technology Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- OpenAI API (GPT-4)
- CSS Modules for styling

