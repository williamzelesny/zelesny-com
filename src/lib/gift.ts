/**
 * Parsing and validation for the gift data behind /gift.
 *
 * This module is deliberately a pure function over a raw string: it does not
 * import `astro:env/server` itself. The page performs that import and passes
 * the value in, which is what keeps this testable -- the virtual module does
 * not resolve under Vitest.
 *
 * Every thrown message identifies an offending entry by its array index and
 * never by its name or code. This repository's Actions logs are public, and
 * GitHub masks only the exact full secret string it was given, never a
 * substring pulled out of it. That includes the text of a JSON parse error,
 * which quotes the input back -- so parse failures are re-thrown with our own
 * message rather than the native one.
 */

export interface GiftChild {
	name: string;
	code: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isPresent = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

export function readGiftData(raw: string): GiftChild[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		// Deliberately not re-using the native message -- it quotes the input.
		throw new Error('Gift data is not valid JSON.');
	}

	if (!Array.isArray(parsed)) {
		throw new Error('Gift data must be a list of children.');
	}

	if (parsed.length === 0) {
		throw new Error('Gift data contains no children. An empty page is a failure, not a valid state.');
	}

	const children = parsed.map((entry, index) => {
		if (!isPlainObject(entry)) {
			throw new Error(`Gift data entry ${index} is not an object.`);
		}

		if (!isPresent(entry.name)) {
			throw new Error(`Gift data entry ${index} is missing a name.`);
		}

		if (!isPresent(entry.code)) {
			throw new Error(`Gift data entry ${index} is missing a code.`);
		}

		// Values are returned exactly as supplied; the trim above is a
		// presence check, not normalisation.
		return { name: entry.name, code: entry.code };
	});

	const seen = new Map<string, number>();

	children.forEach((child, index) => {
		const first = seen.get(child.code);

		if (first !== undefined) {
			throw new Error(
				`Gift data entry ${index} has the same code as entry ${first}. Two children cannot share a code.`,
			);
		}

		seen.set(child.code, index);
	});

	return children;
}
