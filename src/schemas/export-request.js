export function validateExportRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['Export request body must be a JSON object'];
  }
  return [];
}

export default validateExportRequest;
