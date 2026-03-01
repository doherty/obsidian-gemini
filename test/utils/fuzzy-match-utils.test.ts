import { fuzzyMatch, fuzzyScore } from '../../src/utils/fuzzy-match-utils';

describe('fuzzyMatch', () => {
	describe('basic matching', () => {
		it('should match when all query characters appear in order', () => {
			expect(fuzzyMatch('doc', 'Documents.md')).toBe(true);
		});

		it('should match with non-consecutive characters', () => {
			expect(fuzzyMatch('dm', 'Documents.md')).toBe(true);
		});

		it('should match characters that appear in order (fuzzy)', () => {
			// 'd', 'o', 'm' all appear in "Documents.md" in order, so it matches
			expect(fuzzyMatch('dom', 'Documents.md')).toBe(true);
		});

		it('should not match when characters are not all present', () => {
			expect(fuzzyMatch('dxm', 'Documents.md')).toBe(false);
		});

		it('should be case-insensitive', () => {
			expect(fuzzyMatch('DOC', 'documents.md')).toBe(true);
			expect(fuzzyMatch('Doc', 'DOCUMENTS.MD')).toBe(true);
		});

		it('should match empty query against any text', () => {
			expect(fuzzyMatch('', 'anything.md')).toBe(true);
			expect(fuzzyMatch('', '')).toBe(true);
		});

		it('should not match if query is longer than text', () => {
			expect(fuzzyMatch('documents', 'doc.md')).toBe(false);
		});

		it('should match exact substring', () => {
			expect(fuzzyMatch('documents', 'Documents.md')).toBe(true);
		});
	});

	describe('real-world paths', () => {
		it('should match file extension searches', () => {
			expect(fuzzyMatch('md', 'README.md')).toBe(true);
			expect(fuzzyMatch('ts', 'main.ts')).toBe(true);
		});

		it('should match path components', () => {
			expect(fuzzyMatch('docs', 'docs/guide.md')).toBe(true);
			expect(fuzzyMatch('guide', 'docs/guide.md')).toBe(true);
			expect(fuzzyMatch('dg', 'docs/guide.md')).toBe(true);
		});

		it('should match nested paths', () => {
			expect(fuzzyMatch('abc', 'a/b/c/file.md')).toBe(true);
			expect(fuzzyMatch('acf', 'a/b/c/file.md')).toBe(true);
		});

		it('should not match wrong paths', () => {
			expect(fuzzyMatch('xyz', 'a/b/c/file.md')).toBe(false);
		});
	});

	describe('numeric matching', () => {
		it('should match numbers in filenames', () => {
			expect(fuzzyMatch('ch2', 'chapter2.md')).toBe(true);
			expect(fuzzyMatch('2', 'chapter2.md')).toBe(true);
		});

		it('should match mixed alphanumeric patterns', () => {
			expect(fuzzyMatch('v12', 'v1.2.3.ts')).toBe(true);
			expect(fuzzyMatch('123', 'v1.2.3.ts')).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle empty strings', () => {
			expect(fuzzyMatch('', '')).toBe(true);
			expect(fuzzyMatch('a', '')).toBe(false);
		});

		it('should handle special characters', () => {
			expect(fuzzyMatch('file-', 'my-file-name.md')).toBe(true);
			expect(fuzzyMatch('name', 'my-file-name.md')).toBe(true);
		});

		it('should handle spaces', () => {
			expect(fuzzyMatch('my f', 'my file.md')).toBe(true);
			expect(fuzzyMatch('sf', 'some file.md')).toBe(true);
		});
	});
});

describe('fuzzyScore', () => {
	describe('basic scoring', () => {
		it('should return -1 for non-matches', () => {
			expect(fuzzyScore('xyz', 'documents.md')).toBe(-1);
		});

		it('should return a positive score for matches', () => {
			expect(fuzzyScore('doc', 'documents.md')).toBeGreaterThan(0);
		});

		it('should return 0 for empty query', () => {
			expect(fuzzyScore('', 'documents.md')).toBe(0);
		});
	});

	describe('match position preference', () => {
		it('should score earlier matches higher than later matches', () => {
			const scoreEarly = fuzzyScore('doc', 'documents.md');
			const scoreLate = fuzzyScore('doc', 'something-doc.md');
			expect(scoreEarly).toBeGreaterThan(scoreLate);
		});

		it('should give high score when match is at start', () => {
			const scoreStart = fuzzyScore('doc', 'documents.md');
			const scoreNotStart = fuzzyScore('oc', 'documents.md');
			expect(scoreStart).toBeGreaterThan(scoreNotStart);
		});
	});

	describe('consecutive match bonus', () => {
		it('should score consecutive matches higher than spread matches', () => {
			// 'doc' as consecutive should score higher than 'd' far from 'oc'
			const scoreConsec = fuzzyScore('doc', 'documents.md');
			const scoreSpread = fuzzyScore('dcs', 'documents.md');
			expect(scoreConsec).toBeGreaterThan(scoreSpread);
		});
	});

	describe('relevance sorting', () => {
		it('should rank exact prefix matches highest', () => {
			const files = ['documents/readme.md', 'readme.md', 'my-documents.md'];
			const scores = files.map((f) => fuzzyScore('doc', f));
			// readme.md shouldn't match at all
			expect(scores[1]).toBe(-1);
			// documents/* should score higher than my-documents
			expect(scores[0]).toBeGreaterThan(scores[2]);
		});

		it('should rank matches by relevance for sorting', () => {
			const query = 'ch';
			const files = ['chapter1.md', 'my-chapter.md', 'ch-intro.md'];
			const scores = files.map((f) => fuzzyScore(query, f));
			const sorted = files.map((f, i) => ({ file: f, score: scores[i] })).sort((a, b) => b.score - a.score);
			// Both 'chapter1.md' and 'ch-intro.md' start with 'ch', so they score similarly
			// my-chapter should be last (match is later in string)
			expect(sorted[2].file).toBe('my-chapter.md');
			// Top scorer should be one of the ones starting with 'ch'
			expect(['chapter1.md', 'ch-intro.md']).toContain(sorted[0].file);
		});
	});

	describe('complex file paths', () => {
		it('should score docs/guide correctly', () => {
			expect(fuzzyScore('dog', 'docs/guide.md')).toBeGreaterThan(0);
			expect(fuzzyScore('dg', 'docs/guide.md')).toBeGreaterThan(0);
		});

		it('should score different paths consistently', () => {
			const score1 = fuzzyScore('readme', 'readme.md');
			const score2 = fuzzyScore('readme', 'docs/readme.md');
			// Both match, but readme.md should score higher (earlier match)
			expect(score1).toBeGreaterThan(score2);
		});
	});

	describe('numeric scoring', () => {
		it('should score numeric queries', () => {
			expect(fuzzyScore('2', 'chapter2.md')).toBeGreaterThan(0);
			expect(fuzzyScore('21', 'v2.1.3.ts')).toBeGreaterThan(0);
		});

		it('should score mixed alphanumeric', () => {
			expect(fuzzyScore('ch2', 'chapter2.md')).toBeGreaterThan(0);
			expect(fuzzyScore('v1', 'v1.2.3.ts')).toBeGreaterThan(0);
		});
	});

	describe('edge cases', () => {
		it('should handle empty strings', () => {
			expect(fuzzyScore('', '')).toBe(0);
			expect(fuzzyScore('', 'something.md')).toBe(0);
		});

		it('should handle single character query', () => {
			expect(fuzzyScore('d', 'documents.md')).toBeGreaterThan(0);
		});

		it('should handle repeated characters', () => {
			expect(fuzzyScore('mm', 'my-my-file.md')).toBeGreaterThan(0);
			expect(fuzzyScore('ss', 'so-so-so.md')).toBeGreaterThan(0);
		});
	});
});
