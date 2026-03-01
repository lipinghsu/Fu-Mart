// src/utils/helpers.js

/**
 * Normalizes text for searching by lowercasing,
 * removing punctuation, and removing all spaces.
 * e.g., "Mr. Brown" -> "mrbrown"
 */
export const normalizeText = (text = '') => {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.\-,_&'()]/g, '') // Removes common punctuation
    .replace(/\s+/g, '');       // Removes all spaces
};

/**
 * Escapes regex special characters in a string.
 */
export const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');