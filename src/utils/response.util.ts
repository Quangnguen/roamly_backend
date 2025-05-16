export function response(message: string, statusCode: number, status: string) {
  return {
    message,
    statusCode,
    status,
  };
}