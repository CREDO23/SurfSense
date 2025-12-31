/**
 * Utility functions for connector configuration processing
 */

/**
 * Normalizes various input types into a string array.
 * Handles arrays, comma-separated strings, and filters out empty values.
 */
export const normalizeListInput = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
	}
	if (typeof value === "string") {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	}
	return [];
};

/**
 * Compares two string arrays for equality.
 */
export const arraysEqual = (a: string[], b: string[]): boolean => {
	if (a.length !== b.length) return false;
	return a.every((value, index) => value === b[index]);
};

/**
 * Normalizes various input types into a boolean or null.
 * Handles boolean, string, and number inputs.
 */
export const normalizeBoolean = (value: unknown): boolean | null => {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		const lowered = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(lowered)) return true;
		if (["false", "0", "no", "off"].includes(lowered)) return false;
	}
	if (typeof value === "number") {
		if (value === 1) return true;
		if (value === 0) return false;
	}
	return null;
};
