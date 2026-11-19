export function toJsonBundle(profile, draft) { return JSON.stringify({ schemaVersion: 1, groundedOnly: true, profile, draft }, null, 2); }
