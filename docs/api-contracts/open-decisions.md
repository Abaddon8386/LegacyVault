# Quyết định còn mở (Open Decisions)

> **Quy tắc:** mục nào chưa có cột "Người chốt + ngày" thì **chưa phải requirement**. Cột *Đề xuất* là gợi ý của người soạn
> contract để FE/BE có thể làm tiếp (mock/dev), không phải quyết định của nhóm. Khi nhóm chốt: điền cột cuối, cập nhật
> file contract liên quan và `openapi.yaml` trong cùng PR.

## A. Nền tảng (ảnh hưởng mọi endpoint)

| ID | Vấn đề | Đề xuất | Hệ quả nếu đổi | Người chốt + ngày |
|---|---|---|---|---|
| D-API-01 | Base path | `/api/v1` | Đổi toàn bộ URL | _chưa_ |
| D-API-02 | Port local | BE `8080`, FE `5173` | Đổi proxy/CORS | _chưa_ |
| D-API-03 | FE gọi BE khi dev | **Vite proxy** là chính; CORS whitelist `http://localhost:5173` là phương án phụ (đã cài, mặc định tắt) | Cấu hình dev | _chưa_ |
| D-API-04 | Nơi lưu access token ở FE | In-memory (biến JS); mất khi tải lại trang → đăng nhập lại. Tránh `localStorage` (XSS đọc được) | FE guard, trải nghiệm | _chưa_ |
| D-API-05 | Refresh token | **Chưa có** ở Sprint 1. Nếu thêm: refresh token cookie `HttpOnly; Secure; SameSite` + endpoint `/auth/refresh` + bật CSRF cho endpoint đó | Thêm endpoint, đổi `SecurityConfig` | _chưa_ |
| D-API-06 | Phân trang | `page` (từ 0) + `size` (mặc định 20, tối đa 100) + envelope `content/page/size/totalElements/totalPages` | Mọi endpoint danh sách | _chưa_ |
| D-API-07 | Người không phải chủ truy cập Vault/Asset người khác | `404 RESOURCE_NOT_FOUND` (không lộ sự tồn tại). PS-16 ghi "403/404" nên cần chốt | Test ownership | _chưa_ |
| D-API-08 | Kiểu ID công khai | UUID chuỗi. Cần phối hợp task database (PS-73) | Schema + DTO | _chưa_ |
| D-API-09 | Định dạng thời gian | ISO-8601 UTC `Z` | DTO | _chưa_ |
| D-API-10 | Đặt tên JSON/enum | `camelCase` / `UPPER_SNAKE_CASE` | DTO | _chưa_ |
| D-API-11 | Endpoint chẩn đoán DB | Chỉ tồn tại ở profile `dev`, công khai nhưng chỉ trả `UP/DOWN` | `SecurityConfig` | _chưa_ |
| D-API-19 | HTTP status cho vi phạm quy tắc nghiệp vụ | `422` (xung đột trạng thái: `409`) | Bảng mã lỗi | _chưa_ |
| D-API-21 | Hạn dùng & claim của JWT | Thời hạn ngắn, cấu hình qua property; claim tối thiểu `sub` (userId), `roles` | PS-10/11 | _chưa_ |
| D-API-22 | Chống dò mật khẩu (rate limit/khóa tạm) | Ngoài phạm vi Sprint 1, ghi nhận rủi ro | PS-10 | _chưa_ |

## B. Nghiệp vụ theo ticket

| ID | Ticket | Vấn đề | Đề xuất | Người chốt + ngày |
|---|---|---|---|---|
| D-API-12 | PS-12 / PS-21 | **Mâu thuẫn tài liệu:** ST-02 & PS-12 nói Vault mới `ACTIVE`; ma trận trạng thái ghi `DRAFT → ACTIVE` sau ST-01–05 | Tạo Vault `ACTIVE` (theo PS-12); "sẵn sàng cấu hình" tính qua `configuration-check`, không dùng `DRAFT` | _chưa_ |
| D-API-13 | PS-15 | Tài sản dạng `FILE` (ST-02 có file/credential/text) | Sprint 1 chỉ `TEXT`, `CREDENTIAL` qua JSON; `FILE` upload multipart để sau | _chưa_ |
| D-API-14 | PS-17 | Giới hạn file di chúc & nơi lưu | PDF/JPEG/PNG, ≤ 10 MB; nơi lưu do BE chọn, không lộ qua API; **chưa có API tải xuống** | _chưa_ |
| D-API-15 | PS-22 / PS-23 | Khoảng cho phép `checkIntervalDays`; độ dài Grace Period; chu kỳ quét scheduler | Tài liệu gốc chỉ nêu ví dụ 30/90 ngày và chưa chốt Grace → để **cấu hình qua property**, không hardcode giá trị tự đặt | _chưa_ |
| D-API-16 | PS-9 | ST-01 nhắc "gửi xác nhận kích hoạt" | Sprint 1: tài khoản `ACTIVE` ngay, không xác minh email | _chưa_ |
| D-API-17 | PS-9 | Chính sách mật khẩu | 8–72 ký tự (BCrypt giới hạn 72 byte); không yêu cầu ký tự đặc biệt | _chưa_ |
| D-API-18 | PS-19 | Hình dạng URL Trustee | `/api/v1/trustees` (đúng D-TRUSTEE-001) với `vaultId` trong body/query, **không** lồng dưới `/vaults` | _chưa_ |
| D-API-20 | PS-13 | Có API đọc audit cho Admin không | Không trong Sprint 1 | _chưa_ |
| D-API-23 | PS-11 / PS-14 | Có `GET /auth/me` và `GET /vaults` (danh sách) không — ticket không nêu | Có cả hai (FE cần để khởi tạo màn hình) | _chưa_ |
| D-API-24 | PS-16 | Cập nhật Asset: `PUT` hay `PATCH` | `PATCH` (cập nhật một phần: "chỉ update field hợp lệ") | _chưa_ |
| D-API-25 | PS-21 | Hình dạng endpoint "kiểm tra điều kiện Beneficiary" | `GET /vaults/{id}/configuration-check` + chặn bật DMS bằng `422 BENEFICIARY_REQUIRED` | _chưa_ |
| D-API-26 | PS-20 | Lưu số CCCD của Beneficiary | Có thể lưu (cần cho xác minh tại quầy ST-14), **chỉ trả dạng che** (`******1234`); không bắt buộc ở Sprint 1 | _chưa_ |
| D-API-27 | PS-22 | Check-in khi DMS đã `TRIGGERED` (trong Grace) | Sprint 1 từ chối `409 DMS_NOT_MONITORING`; luồng huỷ báo động thuộc LV-OWN-001 cần chốt riêng | _chưa_ |
| D-API-28 | PS-23 | Chạy nhiều instance backend: tránh quét trùng | Dùng khóa DB/`UPDATE ... WHERE status='MONITORING'` điều kiện; chưa thêm thư viện lock | _chưa_ |

## C. Câu hỏi mở kế thừa từ tài liệu nghiệp vụ (không tự biến thành requirement)

1. Cách thể hiện tài sản số phi tập trung (ví Web3/private key) trong văn bản căn cứ phân chia — chờ giảng viên.
2. Thời hạn chờ khi nhóm Beneficiary không thống nhất được Trustee.
3. Số lần/kênh liên hệ Trustee và thời gian chờ trước khi tìm người thay thế.
4. Chuẩn chữ ký số của Legal Verifier (hiện RSA mô phỏng `SIMULATION ONLY`).

## D. Biên bản họp review contract

| Ngày | Người tham dự | Nội dung đã thống nhất | Việc tiếp theo |
|---|---|---|---|
| _điền sau_ | Dương, Long, Ân, Thái, Huy | | |
