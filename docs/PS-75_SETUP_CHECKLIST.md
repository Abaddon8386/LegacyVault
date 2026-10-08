# PS-75 — Kiểm tra hướng dẫn chạy từ clone mới

Trạng thái: **Chưa được thành viên khác kiểm tra**. Đây là mẫu ghi bằng chứng, không phải biên bản đã đạt.

## Thông tin lượt kiểm tra

| Trường | Giá trị cần điền |
| --- | --- |
| Người thực hiện | Chưa xác nhận (đề xuất Huy) |
| Ngày/giờ | Chưa thực hiện |
| Branch/commit SHA | Điền kết quả `git rev-parse HEAD` |
| Windows | Điền phiên bản |
| JDK / Node / npm | Điền phiên bản thực tế |
| SQL Server edition/version | Chờ Long chốt; ghi phiên bản máy thử |
| Server/instance/cổng/authentication | Điền cấu hình máy thử, không ghi mật khẩu |
| PR / Jira | PS-75; bổ sung URL PR khi có |

## Checklist

Ghi kết quả từng mục là **Đạt / Lỗi / Chưa kiểm tra / Đang chờ**, kèm bằng chứng hoặc bước tái hiện. Chỉ tick khi đã thực hiện.

- [ ] Clone repo chính, checkout đúng commit; không dựa vào dependency/cấu hình của bản làm việc cũ.
- [ ] Theo README kiểm tra JDK, Node, npm và Maven Wrapper.
- [ ] `npm ci`, `npm run lint`, `npm run build` thành công.
- [ ] `npm run dev` mở được giao diện; ghi URL thực tế.
- [ ] Kết nối SQL Server bằng cấu hình/tài khoản sẽ chạy backend.
- [ ] Migration/seed PS-73 chạy được; ghi phiên bản schema và dữ liệu thử.
- [ ] Backend khởi động thành công với cấu hình local ngoài repo.
- [ ] Backend `test` và `verify` thành công; đính kèm kết quả cần thiết.
- [ ] API smoke test PS-74 trả kết quả đúng theo contract/xác thực.
- [ ] FE gọi API qua CORS/proxy đã thống nhất.
- [ ] Thao tác chức năng và đối chiếu bản ghi SQL Server thành công.
- [ ] README không thiếu bước và không yêu cầu bí mật/cấu hình riêng của tác giả.
- [ ] Các vấn đề phát hiện đã sửa hoặc có ticket theo dõi được nhóm chấp thuận.
- [ ] PR PS-75 được thành viên khác review và merge trước khi đánh dấu Done.

## Nhật ký kết quả

| Bước/lệnh | Kết quả | Bằng chứng/lỗi | Người xử lý |
| --- | --- | --- | --- |
| Frontend install/lint/build/dev | Chưa kiểm tra bởi nhóm | Điền log/ảnh hoặc mô tả | Thái/Huy |
| SQL Server migration/seed | Đang chờ PS-73 | Chưa có migration/seed trong repo | Long |
| Backend startup/test/verify | Chưa kiểm tra bởi nhóm | Điền log, bỏ token/mật khẩu | Dương/người thử |
| API/CORS/proxy | Đang chờ PS-74 | Chưa có API nghiệp vụ | Dương |
| FE → API → DB | Đang chờ nền tảng và chức năng | Ghi thao tác, response và bản ghi đối chiếu | Người thử |

## Sửa tài liệu sau khi thử

Ghi bước thiếu/sai → sửa README → người thử chạy lại bước bị ảnh hưởng. Không cần chạy lại toàn bộ nếu sửa không ảnh hưởng các bước đã có bằng chứng.

Kết luận lượt kiểm tra: **Chưa thực hiện**. Người xác nhận và ngày: **Chưa có**.

## Kiểm tra sơ bộ khi viết khung — 08/10/2026

Đây là kết quả kiểm tra của Codex trên máy hiện tại, **không thay thế lượt kiểm tra của thành viên khác**. Code nền: `8b0f6fb2bcdeffff730474e1876f7bf7164634a3` trên `develop`; README/checklist là thay đổi local chưa commit.

| Kiểm tra | Kết quả |
| --- | --- |
| JDK / Node / npm | 25.0.4.1 / 24.18.0 / 11.16.0 |
| `mvnw.cmd -version` | Đạt; Maven 3.9.16 nhận JDK 25 |
| Cài dependency frontend | Đạt với `npm ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000` |
| `npm run lint` | Đạt, exit code 0 |
| `npm run build` | Đạt, exit code 0; Vite 8.3.3 theo lockfile |
| Backend startup/test/verify | Chưa kiểm tra; chưa xác nhận SQL Server và quyền kết nối trên máy thử |
| FE trên trình duyệt / API / DB | Chưa kiểm tra |

Lần cài dependency trong sandbox bị chờ và đã dừng; lần tải có quyền mạng hoàn tất. Các tùy chọn tải npm ở trên giới hạn thời gian chờ, không đổi dependency/lockfile.
