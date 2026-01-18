import { NextRequest, NextResponse } from 'next/server';

// Simple string similarity using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Calculate similarity percentage (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLen - distance) / maxLen) * 100;
}

// Normalize strings for comparison (remove extra spaces, punctuation)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?()\[\]{}'"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Check if answer is correct with fuzzy matching
function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeString(userAnswer);
  const normalizedCorrect = normalizeString(correctAnswer);

  // Exact match (after normalization)
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Check if user answer contains the correct answer or vice versa
  if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
    // Only accept if the shorter string is at least 60% of the longer one
    const shorter = Math.min(normalizedUser.length, normalizedCorrect.length);
    const longer = Math.max(normalizedUser.length, normalizedCorrect.length);
    if (shorter / longer >= 0.6) {
      return true;
    }
  }

  // Calculate similarity
  const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
  
  // Accept if similarity is 85% or higher
  return similarity >= 85;
}

export async function POST(request: NextRequest) {
  try {
    const { userAnswer, correctAnswer, question } = await request.json();

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: userAnswer and correctAnswer' },
        { status: 400 }
      );
    }

    const isCorrect = isAnswerCorrect(userAnswer, correctAnswer);
    const normalizedUser = normalizeString(userAnswer);
    const normalizedCorrect = normalizeString(correctAnswer);
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

    return NextResponse.json({
      isCorrect,
      similarity: Math.round(similarity * 100) / 100,
      userAnswer: normalizedUser,
      correctAnswer: normalizedCorrect,
    });
  } catch (error) {
    console.error('Error checking answer:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check answer',
      },
      { status: 500 }
    );
  }
}
