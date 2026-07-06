/**
 * Resolve a scroll/nav section id from component data.
 * Checks top-level `id`, then the first nested object with an `id` field.
 *
 * @param {unknown} data
 * @returns {string}
 */
export function resolveSectionId(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return '';
  }

  const record = /** @type {Record<string, unknown>} */ (data);

  if (typeof record.id === 'string' && record.id) {
    return record.id;
  }

  for (const value of Object.values(record)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }

    const nested = /** @type {Record<string, unknown>} */ (value);
    if (typeof nested.id === 'string' && nested.id) {
      return nested.id;
    }
  }

  return '';
}

export default resolveSectionId;
