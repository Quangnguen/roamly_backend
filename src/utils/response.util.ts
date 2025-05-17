export function response<T = unknown>(message: string, statusCode: number, status: string, data?: T) {
  return {
    data,           // thêm dòng này
    message,
    statusCode,
    status,
  };
}