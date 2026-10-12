import { useEffect, useState } from 'react'
import { getDbCheck, getPing } from './api/system'

// Khối chẩn đoán dùng làm bằng chứng React -> Backend -> SQL Server (PS-74).
// Chỉ để dev kiểm tra kết nối; có thể gỡ khi đã có màn hình nghiệp vụ.
function describe(result) {
  if (result === undefined) return 'đang kiểm tra...'
  if (result.error) return `lỗi: ${result.error.code} (HTTP ${result.error.status})`
  return JSON.stringify(result.data)
}

function SystemStatus() {
  const [ping, setPing] = useState()
  const [db, setDb] = useState()

  useEffect(() => {
    const run = async (call, set) => {
      try {
        set({ data: await call() })
      } catch (error) {
        set({ error })
      }
    }
    run(getPing, setPing)
    run(getDbCheck, setDb)
  }, [])

  return (
    <section aria-label="Trạng thái hệ thống">
      <h2>Trạng thái hệ thống (dev)</h2>
      <ul>
        <li>
          Backend <code>/system/ping</code>: {describe(ping)}
        </li>
        <li>
          SQL Server <code>/system/db-check</code>: {describe(db)}
        </li>
      </ul>
    </section>
  )
}

export default SystemStatus
