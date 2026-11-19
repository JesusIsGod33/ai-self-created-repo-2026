export function normalizeRequirement(value) { return String(value??'').normalize('NFKC').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9+#.\s-]/g,' ').replace(/\s+/g,' ').trim(); }
