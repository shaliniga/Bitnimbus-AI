/**
 * Normalizes text for resilient matching (straightening curly quotes, collapsing whitespace)
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MatchResult {
  start: number;
  end: number;
  exact: boolean;
}

/**
 * Resolves character offsets within a paragraph text, handling drift or formatting mismatches.
 */
export function resolveAnchorRange(
  paragraphText: string,
  start: number,
  end: number,
  quote: string
): MatchResult {
  // 1. Direct offset check
  const directSlice = paragraphText.slice(start, end);
  if (directSlice === quote) {
    return { start, end, exact: true };
  }

  // 2. Normalized direct slice comparison
  if (normalizeText(directSlice) === normalizeText(quote)) {
    return { start, end, exact: true };
  }

  // 3. Substring search for quote within the paragraph
  const foundIndex = paragraphText.indexOf(quote);
  if (foundIndex !== -1) {
    return {
      start: foundIndex,
      end: foundIndex + quote.length,
      exact: true,
    };
  }

  // 4. Normalized substring search
  const normalizedPara = normalizeText(paragraphText);
  const normalizedQuote = normalizeText(quote);
  const normIndex = normalizedPara.indexOf(normalizedQuote);
  if (normIndex !== -1) {
    // Attempt approximate boundary resolution
    const searchPrefix = normalizedQuote.slice(0, Math.min(25, normalizedQuote.length));
    const prefixIndex = paragraphText.toLowerCase().indexOf(searchPrefix.toLowerCase());
    if (prefixIndex !== -1) {
      const estimatedEnd = Math.min(paragraphText.length, prefixIndex + quote.length);
      return {
        start: prefixIndex,
        end: estimatedEnd,
        exact: false,
      };
    }
  }

  // Fallback: clamp to original bounds
  const clampedStart = Math.max(0, Math.min(start, paragraphText.length));
  const clampedEnd = Math.max(clampedStart, Math.min(end, paragraphText.length));
  return {
    start: clampedStart,
    end: clampedEnd,
    exact: false,
  };
}
