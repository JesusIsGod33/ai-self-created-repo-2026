export function normalizeRequirement(value) { return String(value).toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
