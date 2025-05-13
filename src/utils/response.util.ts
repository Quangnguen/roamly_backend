export function createResponse(message: string, statusCode: number, status: string) {
  return {
    message,
    statusCode,
    status,
  };
}