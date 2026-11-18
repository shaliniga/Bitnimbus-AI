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

interface NormalizedTextMap {
  text: string;
  starts: number[];
  ends: number[];
}

function normalizeTextWithMap(text: string): NormalizedTextMap {
  let normalized = '';
  const starts: number[] = [];
  const ends: number[] = [];

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (/\s/.test(character)) {
      if (normalized.length > 0) {
        const lastIndex = normalized.length - 1;
        if (normalized[lastIndex] === ' ') {
          ends[lastIndex] = index + 1;
        } else {
          normalized += ' ';
          starts.push(index);
          ends.push(index + 1);
        }
      }
      continue;
    }

    const normalizedCharacter =
      character === '\u2018' || character === '\u2019'
        ? "'"
        : character === '\u201C' || character === '\u201D'
        ? '"'
        : character;

    normalized += normalizedCharacter;
    starts.push(index);
    ends.push(index + 1);
  }

  if (normalized.endsWith(' ')) {
    normalized = normalized.slice(0, -1);
    starts.pop();
    ends.pop();
  }

  return { text: normalized, starts, ends };
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
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) {
    const emptyPosition = Number.isFinite(start)
      ? Math.max(0, Math.min(Math.trunc(start), paragraphText.length))
      : 0;
    return { start: emptyPosition, end: emptyPosition, exact: false };
  }

  // 1. Direct offset check
  const hasValidOffsets =
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end >= start &&
    end <= paragraphText.length;
  const directSlice = hasValidOffsets ? paragraphText.slice(start, end) : '';
  if (hasValidOffsets && directSlice === quote) {
    return { start, end, exact: true };
  }

  // 2. Normalized direct slice comparison
  if (hasValidOffsets && normalizeText(directSlice) === normalizedQuote) {
    const mappedSlice = normalizeTextWithMap(directSlice);
    if (mappedSlice.starts.length > 0) {
      return {
        start: start + mappedSlice.starts[0],
        end: start + mappedSlice.ends[mappedSlice.ends.length - 1],
        exact: true,
      };
    }
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
  const normalizedParagraph = normalizeTextWithMap(paragraphText);
  const normalizedIndex = normalizedParagraph.text.indexOf(normalizedQuote);
  if (normalizedIndex !== -1) {
    return {
      start: normalizedParagraph.starts[normalizedIndex],
      end: normalizedParagraph.ends[normalizedIndex + normalizedQuote.length - 1],
      exact: true,
    };
  }

  // Do not highlight unrelated text when the quoted span cannot be located.
  const clampedStart = Number.isFinite(start)
    ? Math.max(0, Math.min(Math.trunc(start), paragraphText.length))
    : 0;
  return {
    start: clampedStart,
    end: clampedStart,
    exact: false,
  };
}
