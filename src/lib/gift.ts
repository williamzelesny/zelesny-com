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

/**
 * C0 controls, DEL, zero-width characters, bidi embedding/override/isolates,
 * and the BOM. These are invisible on the page but not to the comparison that
 * checks two children do not share a code -- and U+202E actively reverses the
 * characters after it, so a code can render transposed from what was supplied.
 */
const INVISIBLE = /[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069\uFEFF]/;

/** Fold for comparison only; the value returned to the page stays as supplied. */
const foldForComparison = (value: string): string =>
	value.trim().normalize('NFKC').toLowerCase();

export function readGiftData(raw: string): GiftChild[] {
	// The declared type says string, but this value comes from the environment:
	// a missing variable arrives as undefined. Relying on JSON.parse coercing
	// that to the string "undefined" and throwing would be incidental, not a
	// contract, and a refactor could silently turn it into an uncaught
	// TypeError -- in the one module whose job is to never leak one.
	if (typeof raw !== 'string') {
		throw new Error('Gift data is missing.');
	}

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

		if (INVISIBLE.test(entry.name) || INVISIBLE.test(entry.code)) {
			throw new Error(
				`Gift data entry ${index} contains an invisible or bidirectional control character.`,
			);
		}

		// Values are returned exactly as supplied; the trim above is a
		// presence check, not normalisation.
		return { name: entry.name, code: entry.code };
	});

	// Second pass on purpose: the checks above validate each entry on its own,
	// this one validates relationships between entries.
	const codes = new Map<string, number>();
	const names = new Map<string, number>();

	children.forEach((child, index) => {
		const code = foldForComparison(child.code);
		const firstCode = codes.get(code);

		if (firstCode !== undefined) {
			throw new Error(
				`Gift data entry ${index} has the same code as entry ${firstCode}. Two children cannot share a code.`,
			);
		}

		codes.set(code, index);

		// A repeated name is not a typo the giver can spot: the page would show
		// two identical labels and no way to tell which code belongs to whom.
		const name = foldForComparison(child.name);
		const firstName = names.get(name);

		if (firstName !== undefined) {
			throw new Error(
				`Gift data entry ${index} has the same name as entry ${firstName}. Two children cannot share a name on this page.`,
			);
		}

		names.set(name, index);
	});

	return children;
}
