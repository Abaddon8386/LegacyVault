import { request } from './http'

/** GET /api/v1/system/ping -> { status, service, time } */
export const getPing = () => request('/system/ping')

/** GET /api/v1/system/db-check -> { database: 'UP' | 'DOWN' } (chỉ có khi backend chạy profile dev) */
export const getDbCheck = () => request('/system/db-check')
