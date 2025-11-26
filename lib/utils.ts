import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes code indentation by replacing leading spaces with {{indent}} placeholders.
 * This is the inverse of processBoilerplate - it converts actual indentation back to placeholders.
 *
 * @param code The code string to normalize
 * @returns Code with indentation replaced by {{indent}} placeholders
 */
export function normalizeIndentation(code: string) {
  if (!code || code.trim().length === 0) {
    return code;
  }

  const lines = code.split("\n");
  const nonEmptyLines = lines.filter(
    (line) => line.trim().length > 0 && line.match(/^\s+/)
  );

  // Detect indentation unit by finding the GCD of all indentations
  // This works for any consistent indentation size (2, 3, 4, 5, etc.)
  let indentUnit = 4; // Default fallback

  if (nonEmptyLines.length > 0) {
    // Find all indentation levels (excluding empty lines)
    const indentations = nonEmptyLines.map((line) => {
      const match = line.match(/^(\s+)/);
      return match ? match[1].length : 0;
    });

    // Helper function to calculate GCD (Greatest Common Divisor)
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };

    // Calculate GCD of all indentations to find the base indentation unit
    const uniqueIndents = [...new Set(indentations)].filter(
      (indent) => indent > 0
    );

    if (uniqueIndents.length > 0) {
      // Start with the first unique indent, then find GCD with all others
      indentUnit = uniqueIndents.reduce(
        (acc, indent) => gcd(acc, indent),
        uniqueIndents[0]
      );

      // Ensure we have a reasonable minimum (at least 1)
      if (indentUnit < 1) {
        indentUnit = 1;
      }
    }
  }

  // Normalize each line
  const normalizedLines = lines.map((line) => {
    // Empty lines stay as-is
    if (line.trim().length === 0) {
      return line;
    }

    // Count leading spaces
    const match = line.match(/^(\s+)/);
    if (!match) {
      // No leading whitespace
      return line;
    }

    const leadingSpaces = match[1].length;
    const indentLevel = Math.floor(leadingSpaces / indentUnit);

    // Replace leading spaces with {{indent}} placeholders
    const indentPlaceholders = "{{indent}}".repeat(indentLevel);
    const restOfLine = line.slice(leadingSpaces);

    return indentPlaceholders + restOfLine;
  });

  return normalizedLines.join("\n");
}
