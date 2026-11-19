export function validateJobDescription(input) {
  if (typeof input === 'string') {
    return input.trim().length > 0 ? [] : ['Job description is required'];
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['Job description must be a string or object'];
  }
  const text = input.text ?? input.description ?? input.content ?? input.body ?? '';
  if (typeof text !== 'string' || text.trim().length === 0) {
    return ['Job description text is required'];
  }
  return [];
}

export default validateJobDescription;
