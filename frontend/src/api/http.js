// Client HTTP dùng chung cho mọi lệnh gọi backend.
// Quy tắc (docs/api-contracts/error-contract.md): phân loại lỗi bằng `code` (và `status`),
// KHÔNG so sánh chuỗi `message` vì message đổi theo ngôn ngữ.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Lỗi trả về từ backend (hoặc lỗi mạng) theo đúng hình dạng JSON lỗi chung. */
export class ApiError extends Error {
  constructor({ status, code, messageKey, message, traceId, errors }) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.messageKey = messageKey
    this.traceId = traceId
    /** Lỗi theo trường (validation): [{ field, code, messageKey, message }] */
    this.fieldErrors = errors ?? []
  }

  is(code) {
    return this.code === code
  }
}

/**
 * @param {string} path đường dẫn sau base URL, ví dụ '/system/ping'
 * @param {{method?: string, body?: unknown, token?: string, locale?: 'vi'|'en'}} [options]
 */
export async function request(path, { method = 'GET', body, token, locale = 'vi' } = {}) {
  const headers = { Accept: 'application/json', 'Accept-Language': locale }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Network error' })
  }

  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    // body rỗng hoặc không phải JSON
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: data?.code ?? 'UNKNOWN_ERROR',
      messageKey: data?.messageKey,
      message: data?.message,
      traceId: data?.traceId ?? response.headers.get('X-Trace-Id'),
      errors: data?.errors,
    })
  }
  return data
}
