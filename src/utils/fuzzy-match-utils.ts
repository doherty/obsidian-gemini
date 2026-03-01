/**
 * Checks if a query string matches a text string using fuzzy matching.
 * All characters from the query must appear in the text in the same relative order,
 * but do not need to be consecutive.
 *
 * @param query The search query (e.g., "doc")
 * @param text The text to search within (e.g., "Documents.md")
 * @returns true if query fuzzy matches text, false otherwise
 *
 * @example
 * fuzzyMatch('doc', 'Documents.md') // => true
 * fuzzyMatch('docs', 'Documents.md') // => true
 * fuzzyMatch('doc', 'readme.md') // => false
 */
export function fuzzyMatch(query: string, text: string): boolean {
	if (!query) {
		return true; // Empty query matches everything
	}

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();

	let queryIdx = 0;

	for (let textIdx = 0; textIdx < textLower.length; textIdx++) {
		if (queryLower[queryIdx] === textLower[textIdx]) {
			queryIdx++;
			if (queryIdx === queryLower.length) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Calculates a relevance score for how well a query matches text.
 * Higher scores indicate better matches.
 *
 * Scoring factors:
 * - Consecutive character matches (streaks) get higher scores
 * - Earlier matches in the text get higher scores
 * - Overall match position (start vs end) affects scoring
 *
 * @param query The search query
 * @param text The text to score
 * @returns A numeric score where higher is better. Returns -1 if no match.
 *
 * @example
 * fuzzyScore('doc', 'Documents.md') // Higher score than fuzzyScore('doc', 'something-documents')
 */
export function fuzzyScore(query: string, text: string): number {
	if (!fuzzyMatch(query, text)) {
		return -1;
	}

	if (!query) {
		return 0;
	}

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();

	let score = 0;
	let queryIdx = 0;
	let consecutiveMatches = 0;
	let lastMatchIdx = -1;

	for (let textIdx = 0; textIdx < textLower.length; textIdx++) {
		if (queryLower[queryIdx] === textLower[textIdx]) {
			// Bonus for matching at the start of the string
			if (textIdx === 0) {
				score += 100;
			}

			// Bonus for matching early in the string
			score += Math.max(0, 50 - textIdx);

			// Bonus for consecutive matches (matching without gaps)
			if (lastMatchIdx === textIdx - 1) {
				consecutiveMatches++;
				score += 20 * consecutiveMatches;
			} else {
				consecutiveMatches = 0;
			}

			lastMatchIdx = textIdx;
			queryIdx++;

			if (queryIdx === queryLower.length) {
				break;
			}
		}
	}

	return score;
}
