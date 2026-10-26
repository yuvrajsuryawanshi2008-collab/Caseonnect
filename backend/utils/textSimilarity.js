/**
 * Explainable Lexical & Token Similarity Utility
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'about', 'against', 'regarding',
  'complaint', 'petition', 'matter', 'allegation', 'institute', 'college'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function computeJaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }
  
  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function findMatchingTokens(tokensA, tokensB) {
  const setB = new Set(tokensB);
  const matches = new Set();
  for (const token of tokensA) {
    if (setB.has(token)) {
      matches.add(token);
    }
  }
  return Array.from(matches);
}

module.exports = {
  tokenize,
  computeJaccardSimilarity,
  findMatchingTokens
};
