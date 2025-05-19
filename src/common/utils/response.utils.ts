// src/common/utils/response.utils.ts
export function response<T>(
  message: string,
  statusCode: number,
  status: string,
  data?: T,
): {
  message: string;
  statusCode: number;
  status: string;
  data?: T;
} {
  return {
    message,
    statusCode,
    status,
    ...(data && { data }),
  };
}
