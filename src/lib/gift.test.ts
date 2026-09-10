import { describe, expect, it } from 'vitest';
import { readGiftData } from './gift';

const json = (value: unknown) => JSON.stringify(value);

/**
 * Distinctive fixture values. The security assertions below check that no
 * thrown message ever echoes these back -- this repository's Actions logs are
 * public, and GitHub masks only the exact full secret string it was given,
 * never a substring pulled out of it.
 */
const NAME = 'Wilhelmina';
const CODE = 'ZZZ-999';

describe('readGiftData', () => {
	describe('valid input', () => {
		it('parses a two-entry list and preserves input order', () => {
			const result = readGiftData(
				json([
					{ name: 'Ada', code: 'AAA-111' },
					{ name: 'Grace', code: 'BBB-222' },
				]),
			);

			expect(result).toEqual([
				{ name: 'Ada', code: 'AAA-111' },
				{ name: 'Grace', code: 'BBB-222' },
			]);
		});

		it('parses a single-entry list', () => {
			expect(readGiftData(json([{ name: 'Ada', code: 'AAA-111' }]))).toHaveLength(1);
		});

		it('parses a three-entry list, assuming no fixed count', () => {
			const result = readGiftData(
				json([
					{ name: 'Ada', code: 'AAA-111' },
					{ name: 'Grace', code: 'BBB-222' },
					{ name: 'Katherine', code: 'CCC-333' },
				]),
			);

			expect(result.map((child) => child.name)).toEqual(['Ada', 'Grace', 'Katherine']);
		});

		it('accepts an entry with unknown extra keys and ignores them', () => {
			const result = readGiftData(
				json([{ name: 'Ada', code: 'AAA-111', birthday: '2019-04-02' }]),
			);

			expect(result).toEqual([{ name: 'Ada', code: 'AAA-111' }]);
		});

		it('returns names and codes unmodified, including whitespace and punctuation', () => {
			const result = readGiftData(json([{ name: "Mary-Jane O'Neill", code: 'AAA 111' }]));

			expect(result[0]).toEqual({ name: "Mary-Jane O'Neill", code: 'AAA 111' });
		});
	});

	describe('unparseable input', () => {
		it('throws when the value is not valid JSON', () => {
			expect(() => readGiftData('{not json')).toThrow(/not valid JSON/i);
		});

		it('throws when the value is an empty string', () => {
			// envField.string() treats "" as present, so the schema will not
			// catch this -- the parse step is what makes R9 hold here.
			expect(() => readGiftData('')).toThrow(/not valid JSON/i);
		});
	});

	describe('wrong shape', () => {
		it.each([
			['an object', json({ name: 'Ada', code: 'AAA-111' })],
			['a bare string', json('AAA-111')],
			['a number', json(3)],
			['null', json(null)],
		])('throws when the payload is %s rather than a list', (_label, payload) => {
			expect(() => readGiftData(payload)).toThrow(/list of children/i);
		});

		it('throws on an empty list rather than rendering an empty page', () => {
			expect(() => readGiftData(json([]))).toThrow(/no children/i);
		});

		it.each([
			['null', null],
			['a string', 'Ada'],
			['a number', 7],
			['an array', []],
		])('throws when an entry is %s rather than an object', (_label, entry) => {
			expect(() => readGiftData(json([entry]))).toThrow(/entry 0/i);
		});
	});

	describe('missing or empty fields', () => {
		it.each([
			['missing', { code: 'AAA-111' }],
			['empty', { name: '', code: 'AAA-111' }],
			['whitespace only', { name: '   ', code: 'AAA-111' }],
		])('throws when the name is %s', (_label, entry) => {
			expect(() => readGiftData(json([entry]))).toThrow(/entry 0.*name/i);
		});

		it.each([
			['missing', { name: 'Ada' }],
			['empty', { name: 'Ada', code: '' }],
			['whitespace only', { name: 'Ada', code: '  ' }],
		])('throws when the code is %s', (_label, entry) => {
			expect(() => readGiftData(json([entry]))).toThrow(/entry 0.*code/i);
		});

		it('identifies the offending entry by its index, not the first entry', () => {
			const payload = json([
				{ name: 'Ada', code: 'AAA-111' },
				{ name: 'Grace', code: '' },
			]);

			expect(() => readGiftData(payload)).toThrow(/entry 1/i);
		});
	});

	describe('duplicate codes', () => {
		it('throws when two entries share a code, naming both indices', () => {
			const payload = json([
				{ name: 'Ada', code: 'AAA-111' },
				{ name: 'Grace', code: 'AAA-111' },
			]);

			expect(() => readGiftData(payload)).toThrow(/entry 1.*entry 0|entry 0.*entry 1/i);
		});
	});

	/**
	 * The guard that keeps a child's name out of a public CI log. Every error
	 * path is exercised with fixture values distinctive enough that an
	 * accidental echo is unmistakable.
	 */
	describe('error messages never echo entry data', () => {
		const badPayloads: Array<[string, string]> = [
			['entry is not an object', json([NAME])],
			['name missing', json([{ code: CODE }])],
			['name empty', json([{ name: '', code: CODE }])],
			['code missing', json([{ name: NAME }])],
			['code empty', json([{ name: NAME, code: '' }])],
			[
				'duplicate codes',
				json([
					{ name: NAME, code: CODE },
					{ name: 'Other', code: CODE },
				]),
			],
			['not a list', json({ name: NAME, code: CODE })],
		];

		it.each(badPayloads)('leaks nothing when %s', (_label, payload) => {
			expect(() => readGiftData(payload)).toThrow();
			try {
				readGiftData(payload);
			} catch (error) {
				const message = (error as Error).message;
				expect(message).not.toContain(NAME);
				expect(message).not.toContain(CODE);
			}
		});

		it('does not echo the raw payload when it is unparseable', () => {
			const payload = `${NAME}:${CODE}`;

			expect(() => readGiftData(payload)).toThrow();
			try {
				readGiftData(payload);
			} catch (error) {
				const message = (error as Error).message;
				expect(message).not.toContain(NAME);
				expect(message).not.toContain(CODE);
			}
		});
	});
});
