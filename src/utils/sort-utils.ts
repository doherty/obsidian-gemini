/**
 * Compares two strings using natural (lexicographic with numeric) sorting.
 * Handles numeric segments numerically (e.g., file1 < file2 < file10)
 * and text segments lexicographically with case-insensitive comparison.
 *
 * @param a First string to compare
 * @param b Second string to compare
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 *
 * @example
 * ['file10.md', 'file2.md', 'file1.md'].sort(naturalCompare)
 * // => ['file1.md', 'file2.md', 'file10.md']
 */
export function naturalCompare(a: string, b: string): number {
	// Convert to lowercase for case-insensitive comparison
	const aLower = a.toLowerCase();
	const bLower = b.toLowerCase();

	// If strings are equal, return 0
	if (aLower === bLower) {
		return 0;
	}

	// Split into segments of text and numbers
	const aSegments = splitSegments(aLower);
	const bSegments = splitSegments(bLower);

	// Compare segment by segment
	const minLength = Math.min(aSegments.length, bSegments.length);

	for (let i = 0; i < minLength; i++) {
		const aSeg = aSegments[i];
		const bSeg = bSegments[i];

		// Check if both segments are numeric
		if (/^\d+$/.test(aSeg) && /^\d+$/.test(bSeg)) {
			const aNum = parseInt(aSeg, 10);
			const bNum = parseInt(bSeg, 10);
			if (aNum !== bNum) {
				return aNum < bNum ? -1 : 1;
			}
		} else {
			// Text comparison (case-insensitive already done via toLowerCase)
			if (aSeg !== bSeg) {
				return aSeg < bSeg ? -1 : 1;
			}
		}
	}

	// If all compared segments are equal, the shorter string comes first
	return aSegments.length - bSegments.length;
}

/**
 * Splits a string into segments of text and numeric chunks.
 * @param str String to split
 * @returns Array of segments
 *
 * @example
 * splitSegments('file10.md')
 * // => ['file', '10', '.md']
 */
function splitSegments(str: string): string[] {
	return str.split(/(\d+)/g).filter((seg) => seg.length > 0);
}
