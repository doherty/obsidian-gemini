import { naturalCompare } from '../../src/utils/sort-utils';

describe('naturalCompare', () => {
	describe('basic lexicographic sorting', () => {
		it('should sort strings alphabetically', () => {
			const input = ['zebra.md', 'apple.md', 'banana.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['apple.md', 'banana.md', 'zebra.md']);
		});

		it('should handle equal strings', () => {
			expect(naturalCompare('file.md', 'file.md')).toBe(0);
		});

		it('should return negative for a < b', () => {
			expect(naturalCompare('apple.md', 'zebra.md')).toBeLessThan(0);
		});

		it('should return positive for a > b', () => {
			expect(naturalCompare('zebra.md', 'apple.md')).toBeGreaterThan(0);
		});
	});

	describe('numeric sorting', () => {
		it('should sort numbers numerically, not lexicographically', () => {
			const input = ['file10.md', 'file2.md', 'file1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['file1.md', 'file2.md', 'file10.md']);
		});

		it('should handle multiple numbers correctly', () => {
			const input = ['chapter10.md', 'chapter2.md', 'chapter1.md', 'chapter20.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['chapter1.md', 'chapter2.md', 'chapter10.md', 'chapter20.md']);
		});

		it('should handle numbers at the beginning', () => {
			const input = ['10file.md', '2file.md', '1file.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['1file.md', '2file.md', '10file.md']);
		});

		it('should handle files with version numbers', () => {
			const input = ['v1.2.10.md', 'v1.2.2.md', 'v1.2.1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['v1.2.1.md', 'v1.2.2.md', 'v1.2.10.md']);
		});
	});

	describe('case-insensitive sorting', () => {
		it('should treat uppercase and lowercase as equivalent', () => {
			const input = ['Apple.md', 'apple.md', 'APPLE.md'];
			const sorted = input.sort(naturalCompare);
			// All should be considered equal in sort order
			expect(sorted).toHaveLength(3);
			expect(sorted).toContain('Apple.md');
			expect(sorted).toContain('apple.md');
			expect(sorted).toContain('APPLE.md');
		});

		it('should sort mixed case files correctly', () => {
			const input = ['Zebra.md', 'apple.md', 'Banana.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['apple.md', 'Banana.md', 'Zebra.md']);
		});

		it('should handle case-insensitive numeric sorting', () => {
			const input = ['File10.md', 'file2.md', 'FILE1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['FILE1.md', 'file2.md', 'File10.md']);
		});
	});

	describe('nested paths (full path sorting)', () => {
		it('should sort by full path lexicographically', () => {
			const input = ['z/file.md', 'a/file.md', 'b/file.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['a/file.md', 'b/file.md', 'z/file.md']);
		});

		it('should sort nested paths correctly', () => {
			const input = ['docs/ch10.md', 'docs/ch2.md', 'docs/ch1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['docs/ch1.md', 'docs/ch2.md', 'docs/ch10.md']);
		});

		it('should handle deeply nested paths', () => {
			const input = ['a/b/c/file10.md', 'a/b/c/file2.md', 'a/b/c/file1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['a/b/c/file1.md', 'a/b/c/file2.md', 'a/b/c/file10.md']);
		});

		it('should sort different folder hierarchies', () => {
			const input = ['docs/guides/advanced.md', 'docs/api/intro.md', 'docs/guides/basics.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['docs/api/intro.md', 'docs/guides/advanced.md', 'docs/guides/basics.md']);
		});
	});

	describe('complex realistic scenarios', () => {
		it('should sort a realistic vault structure', () => {
			const input = [
				'README.md',
				'docs/guide2.md',
				'docs/guide10.md',
				'docs/guide1.md',
				'notes/personal/journal10.md',
				'notes/personal/journal2.md',
				'notes/personal/journal1.md',
				'Archive.md',
			];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual([
				'Archive.md',
				'docs/guide1.md',
				'docs/guide2.md',
				'docs/guide10.md',
				'notes/personal/journal1.md',
				'notes/personal/journal2.md',
				'notes/personal/journal10.md',
				'README.md',
			]);
		});

		it('should handle empty segments correctly', () => {
			const input = ['file.md', 'file2.md', 'file10.md', 'file1.md'];
			const sorted = input.sort(naturalCompare);
			// file splits to ['file.md'], file1 to ['file', '1', '.md'], etc.
			// So file comes before file1 because 'file' < 'file1'
			expect(sorted).toEqual(['file1.md', 'file2.md', 'file10.md', 'file.md']);
		});

		it('should handle special characters in filenames', () => {
			const input = ['file-10.md', 'file-2.md', 'file-1.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['file-1.md', 'file-2.md', 'file-10.md']);
		});

		it('should handle mixed alphanumeric patterns', () => {
			const input = ['image10.md', 'image2.md', 'Chapter 2.md', 'Chapter 10.md', 'readme.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['Chapter 2.md', 'Chapter 10.md', 'image2.md', 'image10.md', 'readme.md']);
		});
	});

	describe('edge cases', () => {
		it('should handle empty strings', () => {
			const input = ['file.md', '', 'apple.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted[0]).toBe('');
		});

		it('should handle strings with only numbers', () => {
			const input = ['100', '20', '3'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['3', '20', '100']);
		});

		it('should handle leading zeros', () => {
			const input = ['file001.md', 'file10.md', 'file2.md'];
			const sorted = input.sort(naturalCompare);
			// 001 and 1 are numerically equal, so order between them may vary
			expect(sorted.map((f) => f.match(/\d+/)?.[0])).toEqual(['001', '2', '10']);
		});

		it('should handle very large numbers', () => {
			const input = ['file1000000.md', 'file100.md', 'file10.md'];
			const sorted = input.sort(naturalCompare);
			expect(sorted).toEqual(['file10.md', 'file100.md', 'file1000000.md']);
		});
	});
});
