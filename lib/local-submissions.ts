// Utility functions for managing user submissions in localStorage
// for users who are not logged in

export interface LocalSubmission {
  date: string; // YYYY-MM-DD format
  language: string;
  code: string;
  attempts: boolean[][]; // Array of test case results for each attempt
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

const STORAGE_KEY = "leetcodle_local_submissions";

/**
 * Get all local submissions from localStorage
 */
export function getLocalSubmissions(): LocalSubmission[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as LocalSubmission[];
  } catch (error) {
    console.error("Failed to parse local submissions:", error);
    return [];
  }
}

/**
 * Get submission for a specific problem date
 */
export function getLocalSubmission(date: string): LocalSubmission | null {
  const submissions = getLocalSubmissions();
  return submissions.find((sub) => sub.date === date) || null;
}

/**
 * Save or update a submission for a specific problem date
 */
export function saveLocalSubmission(
  date: string,
  language: string,
  code: string,
  attemptResults: boolean[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const submissions = getLocalSubmissions();
    const existingIndex = submissions.findIndex((sub) => sub.date === date);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing submission
      const existing = submissions[existingIndex];

      // Check if we've reached the 5 attempt limit
      if (existing.attempts.length >= 5) {
        throw new Error("All 5 attempts have been used for this problem");
      }

      submissions[existingIndex] = {
        ...existing,
        language,
        code,
        attempts: [...existing.attempts, attemptResults],
        updated_at: now
      };
    } else {
      // Create new submission
      submissions.push({
        date,
        language,
        code,
        attempts: [attemptResults],
        created_at: now,
        updated_at: now
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error("Failed to save local submission:", error);
    throw error;
  }
}

/**
 * Clear all local submissions
 */
export function clearLocalSubmissions(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear local submissions:", error);
  }
}

/**
 * Get all problem dates that have been attempted locally
 */
export function getLocalSubmissionDates(): string[] {
  const submissions = getLocalSubmissions();
  return submissions.map((sub) => sub.date);
}
