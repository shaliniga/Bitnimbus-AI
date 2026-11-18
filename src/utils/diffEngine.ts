export type DiffType = 'unchanged' | 'added' | 'removed';

export interface DiffToken {
  type: DiffType;
  value: string;
}

/**
 * Tokenizes text preserving whitespace and punctuation
 */
function tokenize(text: string): string[] {
  // Matches words or spaces/punctuation sequences
  return text.match(/(\w+|[^\w\s]|\s+)/g) || [text];
}

/**
 * Computes token-level diff between original and proposed text using Longest Common Subsequence
 */
export function computeWordDiff(original: string, proposed: string): DiffToken[] {
  const origTokens = tokenize(original);
  const propTokens = tokenize(proposed);

  const n = origTokens.length;
  const m = propTokens.length;

  // Optimize for exact matches
  if (original === proposed) {
    return [{ type: 'unchanged', value: original }];
  }

  // DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (origTokens[i] === propTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff tokens
  const rawDiff: DiffToken[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === propTokens[j - 1]) {
      rawDiff.push({ type: 'unchanged', value: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: 'added', value: propTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({ type: 'removed', value: origTokens[i - 1] });
      i--;
    }
  }

  rawDiff.reverse();

  // Merge consecutive tokens of same diff type
  const merged: DiffToken[] = [];
  for (const token of rawDiff) {
    if (merged.length > 0 && merged[merged.length - 1].type === token.type) {
      merged[merged.length - 1].value += token.value;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
}
