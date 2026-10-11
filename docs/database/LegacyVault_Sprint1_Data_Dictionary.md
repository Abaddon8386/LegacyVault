LegacyVault — Data Dictionary

PS-73 — Revised theo PS-9 đến PS-23

Phạm vi: 14 bảng nền tảng/ứng dụng theo migration đề xuất; Microsoft SQL Server; kiểu dữ liệu T-SQL.

Lưu ý: Đây là bản đề xuất cần review cùng nhóm. Chỉ áp dụng V1 mới trên database sạch. Nếu V1 cũ đã chạy ở môi trường dùng chung, không sửa lịch sử migration; tạo V2 để thay đổi schema. SHA-256 chỉ phục vụ kiểm tra toàn vẹn, không chứng minh giá trị pháp lý của tài liệu.


# 1. Danh sách bảng
| Bảng | Mục đích |
| --- | --- |
| users | Tài khoản người dùng |
| roles | Danh mục vai trò |
| user_roles | Gán vai trò cho tài khoản |
| vaults | Kho di sản số |
| assets | Tài sản logic thuộc Vault |
| asset_versions | Phiên bản file/tài liệu đã upload; SHA-256 và metadata |
| trustees | Người thi hành/Trustee được chỉ định cho Vault |
| beneficiaries | Người thụ hưởng được chỉ định |
| asset_allocations | Phân bổ tài sản cho người thụ hưởng |
| dms_configs | Một cấu hình Dead Man’s Switch cho mỗi tài khoản Owner |
| vitality_check_logs | Lịch sử sự kiện check-in/DMS |
| audit_logs | Nhật ký kiểm toán append-only |
| legal_documents | Hồ sơ nghiệp vụ của tài liệu pháp lý như di chúc |
| legal_verifications | Lịch sử các lần xác minh và quyết định pháp lý |


# 2. Chi tiết thuộc tính

## users — Tài khoản
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| user_id | BIGINT IDENTITY | PK | Mã tài khoản |
| full_name | NVARCHAR(150) | NOT NULL | Họ tên |
| email | NVARCHAR(254) | UNIQUE, NOT NULL | Email đăng nhập |
| phone_number | NVARCHAR(20) | NULL | Số điện thoại |
| password_hash | NVARCHAR(255) | NOT NULL | Hash mật khẩu; không lưu mật khẩu gốc |
| status | NVARCHAR(20) | DEFAULT PENDING | Trạng thái tài khoản |
| email_verified_at | DATETIME2 | NULL | Thời điểm xác nhận email |
| created_at | DATETIME2 | DEFAULT UTC | Thời điểm tạo |
| updated_at | DATETIME2 | DEFAULT UTC | Thời điểm cập nhật; ứng dụng phải cập nhật khi sửa |


## roles — Vai trò
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| role_id | BIGINT IDENTITY | PK | Mã vai trò |
| role_code | NVARCHAR(50) | UNIQUE, NOT NULL | Một trong 5 mã vai trò đã thống nhất |
| role_name | NVARCHAR(100) | NOT NULL | Tên hiển thị |
| description | NVARCHAR(255) | NULL | Mô tả |


## user_roles — Gán vai trò
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| user_id | BIGINT | PK, FK users | Tài khoản |
| role_id | BIGINT | PK, FK roles | Vai trò |
| assigned_by_user_id | BIGINT | FK users, NULL | Tài khoản thực hiện gán |
| assigned_at | DATETIME2 | DEFAULT UTC | Thời điểm gán |


## vaults — Vault
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| vault_id | BIGINT IDENTITY | PK | Mã Vault |
| owner_user_id | BIGINT | FK users, UNIQUE | Mỗi Owner tối đa một Vault theo thiết kế hiện tại |
| vault_name | NVARCHAR(150) | NOT NULL | Tên Vault |
| description | NVARCHAR(MAX) | NULL | Mô tả |
| status | NVARCHAR(40) | DEFAULT ACTIVE | Trạng thái Vault |
| created_at / updated_at | DATETIME2 | DEFAULT UTC | Thời điểm tạo/cập nhật |


## assets — Tài sản logic
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| asset_id | BIGINT IDENTITY | PK | Mã tài sản |
| vault_id | BIGINT | FK vaults, NOT NULL | Vault sở hữu tài sản |
| asset_type | NVARCHAR(40) | NOT NULL | Loại tài sản; ví dụ DOCUMENT |
| title | NVARCHAR(200) | NOT NULL | Tên hiển thị |
| description | NVARCHAR(MAX) | NULL | Mô tả |
| encrypted_payload | VARBINARY(MAX) | NULL | Payload mã hóa cho tài sản không dùng asset_versions |
| encryption_iv | BINARY(12) | NULL | IV tương ứng với payload nếu có |
| encryption_key_version | NVARCHAR(50) | NULL | Phiên bản khóa, không chứa khóa bí mật |
| status | NVARCHAR(20) | DEFAULT ACTIVE | Trạng thái |
| created_at / updated_at | DATETIME2 | DEFAULT UTC | Thời điểm tạo/cập nhật |


## asset_versions — Phiên bản tài liệu
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| asset_version_id | BIGINT IDENTITY | PK | Mã phiên bản |
| asset_id | BIGINT | FK assets, NOT NULL | Tài sản logic tương ứng |
| version_no | INT | UNIQUE theo asset_id, CHECK >= 1 | Số phiên bản |
| original_file_name | NVARCHAR(255) | NOT NULL | Tên file gốc; không dùng làm đường dẫn lưu trữ |
| content_type | NVARCHAR(150) | NOT NULL | MIME type |
| file_size_bytes | BIGINT | CHECK > 0 | Kích thước file |
| sha256_hash | CHAR(64) | NOT NULL | SHA-256 của file theo quy ước thống nhất |
| encrypted_file_content | VARBINARY(MAX) | NOT NULL | Nội dung file đã mã hóa |
| encryption_iv | BINARY(12) | NOT NULL | IV của file |
| encryption_key_version | NVARCHAR(50) | NOT NULL | Phiên bản khóa |
| upload_status | NVARCHAR(20) | DEFAULT UPLOADED | UPLOADED không đồng nghĩa LEGAL_APPROVED |
| uploaded_by_user_id | BIGINT | FK users | Tài khoản tải lên |
| uploaded_at | DATETIME2 | DEFAULT UTC | Thời điểm upload |


## trustees — Trustee
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| trustee_id | BIGINT IDENTITY | PK | Mã Trustee |
| vault_id | BIGINT | FK vaults, UNIQUE | Tối đa một Trustee hiện diện theo thiết kế hiện tại |
| full_name | NVARCHAR(150) | NOT NULL | Họ tên |
| phone_number | NVARCHAR(20) | NOT NULL | Số điện thoại |
| email | NVARCHAR(254) | NULL | Email |
| relationship_to_owner | NVARCHAR(100) | NULL | Quan hệ với Owner |
| status | NVARCHAR(20) | DEFAULT APPOINTED | Trạng thái chỉ định |
| appointed_at / revoked_at | DATETIME2 | revoked_at NULL | Thời điểm chỉ định/thu hồi |


## beneficiaries — Người thụ hưởng
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| beneficiary_id | BIGINT IDENTITY | PK | Mã người thụ hưởng |
| vault_id | BIGINT | FK vaults | Vault chỉ định người này |
| linked_user_id | BIGINT | FK users, NULL | Tài khoản liên kết nếu đã đăng ký |
| full_name | NVARCHAR(150) | NOT NULL | Họ tên |
| email / phone_number | NVARCHAR(254) / NVARCHAR(20) | NULL | Thông tin liên hệ |
| identity_document_type | NVARCHAR(30) | NULL | Loại giấy tờ nếu thu thập |
| identity_document_no_encrypted | VARBINARY(512) | NULL | Số giấy tờ đã mã hóa |
| designation_status | NVARCHAR(20) | DEFAULT DESIGNATED | Trạng thái chỉ định |
| id_verification_status | NVARCHAR(30) | DEFAULT NOT_VERIFIED | Trạng thái xác minh |
| account_status | NVARCHAR(30) | DEFAULT NOT_CREATED | Trạng thái tài khoản |
| created_at | DATETIME2 | DEFAULT UTC | Thời điểm tạo |


## asset_allocations — Phân bổ tài sản
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| allocation_id | BIGINT IDENTITY | PK | Mã phân bổ |
| asset_id | BIGINT | FK assets | Tài sản được phân bổ |
| beneficiary_id | BIGINT | FK beneficiaries | Người thụ hưởng |
| allocation_description | NVARCHAR(MAX) | NULL | Hướng dẫn/phạm vi phân bổ |
| version_no | INT | DEFAULT 1, CHECK >= 1 | Phiên bản bản ghi phân bổ |
| status | NVARCHAR(20) | DEFAULT DRAFT | Trạng thái |
| created_at | DATETIME2 | DEFAULT UTC | Thời điểm tạo |


## dms_configs — Dead Man’s Switch
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| dms_id | BIGINT IDENTITY | PK | Mã cấu hình DMS |
| owner_user_id | BIGINT | FK users, UNIQUE | Một DMS cho mỗi tài khoản Owner, không phải mỗi Vault |
| check_interval_days | SMALLINT | CHECK > 0 | Khoảng cách check-in |
| grace_period_days | SMALLINT | CHECK >= 0 | Số ngày ân hạn |
| status | NVARCHAR(30) | DEFAULT MONITORING | MONITORING/TRIGGERED/PAUSED/CANCELLED theo quy tắc nghiệp vụ |
| last_check_in_at | DATETIME2 | NULL | Check-in gần nhất |
| next_check_at | DATETIME2 | NULL | Hạn check-in tiếp theo |
| triggered_at | DATETIME2 | NULL | Thời điểm chuyển TRIGGERED |
| grace_period_ends_at | DATETIME2 | NULL | Hạn kết thúc grace |
| updated_at | DATETIME2 | DEFAULT UTC | Thời điểm cập nhật |


## vitality_check_logs — Lịch sử DMS
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| check_log_id | BIGINT IDENTITY | PK | Mã sự kiện |
| dms_id | BIGINT | FK dms_configs | DMS liên quan |
| event_type | NVARCHAR(30) | NOT NULL | Ví dụ CHECK_REQUESTED, CHECK_IN_RECEIVED, MISSED, GRACE_STARTED, DMS_TRIGGERED |
| event_at | DATETIME2 | DEFAULT UTC | Thời điểm sự kiện |
| channel | NVARCHAR(30) | NULL | Kênh liên lạc |
| details | NVARCHAR(MAX) | NULL | Thông tin bổ sung; không ghi bí mật dạng rõ |


## audit_logs — Audit log
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| audit_log_id | BIGINT IDENTITY | PK | Mã sự kiện audit |
| actor_user_id | BIGINT | FK users, NULL | NULL với sự kiện hệ thống |
| vault_id | BIGINT | FK vaults, NULL | Vault liên quan |
| action | NVARCHAR(100) | NOT NULL | Hành động |
| entity_type | NVARCHAR(50) | NOT NULL | Loại entity chịu tác động |
| entity_id | BIGINT | NULL | Mã entity chịu tác động |
| occurred_at | DATETIME2 | DEFAULT UTC | Thời điểm |
| ip_address | VARCHAR(45) | NULL | IPv4/IPv6 |
| details | NVARCHAR(MAX) | NULL, JSON nếu có | Không log nội dung di chúc, mật khẩu hoặc khóa |
| retention_until | DATETIME2 | NULL | Mốc lưu giữ theo chính sách |


## legal_documents — Hồ sơ tài liệu pháp lý
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| legal_document_id | BIGINT IDENTITY(1,1) | PK | Mã hồ sơ tài liệu pháp lý. |
| asset_id | BIGINT | FK assets, UNIQUE, NOT NULL | Asset đại diện file/tài liệu; mỗi Asset tối đa một hồ sơ LegalDocument trong thiết kế này. |
| document_type | NVARCHAR(40) | NOT NULL | Loại tài liệu, ví dụ WILL, DEATH_CERTIFICATE, OWNERSHIP_DOCUMENT; danh mục cần thống nhất. |
| verification_status | NVARCHAR(30) | NOT NULL DEFAULT 'PENDING_VERIFICATION' | Trạng thái hiện tại của quy trình xác minh; upload không tự đặt LEGAL_APPROVED. |
| submitted_at | DATETIME2 | NULL | Thời điểm gửi tài liệu đi xác minh. |
| current_verification_id | BIGINT | FK legal_verifications, NULL (tùy chọn) | Quyết định/lần xác minh hiện tại nếu cần truy cập nhanh; cần tránh vòng FK hoặc cập nhật không nhất quán. |
| created_at | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() | Thời điểm tạo hồ sơ. |
| updated_at | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() | Thời điểm cập nhật; service phải cập nhật khi UPDATE. |
| assets | legal_documents | 1:0..1 | legal_documents.asset_id UNIQUE |
| legal_documents | legal_verifications | 1:N | legal_verifications.legal_document_id |
| users | legal_verifications | 1:0..N | verifier_user_id nullable; một verifier xử lý nhiều lần xác minh |


## legal_verifications — Lịch sử xác minh tài liệu pháp lý
| Thuộc tính | Kiểu dữ liệu | Khóa / ràng buộc | Ý nghĩa |
| --- | --- | --- | --- |
| verification_id | BIGINT IDENTITY(1,1) | PK | Mã lần xác minh/quyết định. |
| legal_document_id | BIGINT | FK legal_documents, NOT NULL | Hồ sơ tài liệu được xác minh. |
| verifier_user_id | BIGINT | FK users, NULL nếu quyết định do hệ thống tạo | Tài khoản người xác minh; quyền phải được kiểm tra bằng RBAC. |
| result | NVARCHAR(30) | NOT NULL | Kết quả của lần xử lý, ví dụ PENDING, APPROVED, REJECTED, NEEDS_CORRECTION. |
| remarks | NVARCHAR(1000) | NULL | Lý do/ghi chú quyết định; không lưu nội dung bí mật hoặc bản sao tài liệu trong trường này. |
| requested_at | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() | Thời điểm tạo yêu cầu xác minh. |
| decided_at | DATETIME2 | NULL | Thời điểm đưa ra quyết định; NULL khi chưa có quyết định cuối. |
| created_at | DATETIME2 | NOT NULL DEFAULT SYSUTCDATETIME() | Thời điểm ghi nhận lịch sử. |


# 3. Quy tắc nghiệp vụ liên quan đến PS-17, PS-18, PS-21 và PS-23
LegalDocument: chỉ dùng cho tài liệu cần quy trình pháp lý riêng. Asset/AssetVersion quản lý tài sản và file; LegalDocument quản lý loại tài liệu/trạng thái nghiệp vụ; LegalVerification lưu từng lần xác minh để không mất lịch sử.

LegalVerification: kết quả từng lần xác minh là lịch sử; không ghi đè hoặc xóa các quyết định cũ khi xác minh lại. Cần kiểm tra quyền của verifier và audit mỗi quyết định.

PS-17: file số hóa di chúc phải thuộc đúng Vault/Owner. Upload thành công đặt trạng thái UPLOADED; không tự đặt LEGAL_APPROVED. Không ghi nội dung file hoặc bí mật vào log; tạo audit event.

PS-18: mỗi asset_versions lưu số phiên bản, SHA-256 và metadata file. Quy ước hash phải nhất quán (khuyến nghị tính trên bytes của file gốc trước mã hóa, nếu nhóm chọn quy ước này thì phải dùng nhất quán khi kiểm tra). Hash phát hiện thay đổi, không chứng minh giá trị pháp lý.

PS-21: phải có ít nhất một Beneficiary để hoàn tất cấu hình. Đây là quy tắc nghiệp vụ cần được kiểm tra trong service/transaction; không nên giả định chỉ có FK là bảo đảm được điều kiện >= 1.

PS-23: Scheduler chỉ chuyển DMS quá hạn sang TRIGGERED và ghi grace_period_ends_at cùng audit. Không tự chuyển sang DEATH_CONFIRMED/UNLOCKED và không giải mã tài sản.

Trustee: migration đề xuất UNIQUE(vault_id), phù hợp giả định một Trustee cho mỗi Vault. Nếu nghiệp vụ cho phép lịch sử nhiều Trustee, cần đổi thiết kế sang filtered unique index cho bản ghi đang hiệu lực thay vì UNIQUE đơn giản.

Asset allocation: FK riêng không bảo đảm asset và beneficiary thuộc cùng Vault; service phải xác thực hai bản ghi cùng vault_id hoặc nhóm phải thiết kế constraint bổ sung.

updated_at: DEFAULT chỉ thiết lập giá trị lúc INSERT; service cần cập nhật updated_at khi UPDATE.

Append-only audit: migration thêm trigger chặn UPDATE/DELETE. Tài khoản runtime vẫn cần quyền SQL tối thiểu; không dùng db_owner để tránh bypass cơ chế bảo vệ.


# 4. Quan hệ chính
| Entity A | Entity B | Bội số | Triển khai |
| --- | --- | --- | --- |
| users | roles | N:M | Qua user_roles |
| users | vaults | 1 : 0..1 | vaults.owner_user_id UNIQUE |
| vaults | assets | 1:N | assets.vault_id |
| assets | asset_versions | 1:N | asset_versions.asset_id |
| users | asset_versions | 1:N | uploaded_by_user_id |
| vaults | trustees | 1:0..1 | trustees.vault_id UNIQUE trong bản đề xuất |
| vaults | beneficiaries | 1:N | beneficiaries.vault_id |
| assets | beneficiaries | N:M | Qua asset_allocations; service phải kiểm tra cùng Vault |
| users | dms_configs | 1:0..1 | dms_configs.owner_user_id UNIQUE |
| dms_configs | vitality_check_logs | 1:N | vitality_check_logs.dms_id |
| users | audit_logs | 1:0..N | actor_user_id nullable |
| vaults | audit_logs | 1:0..N | vault_id nullable |


# 5. Role codes và seed
Các role_code thống nhất: ROLE_VAULT_OWNER, ROLE_STAFF_EXECUTOR, ROLE_LEGAL_VERIFIER, ROLE_ADMIN, ROLE_BENEFICIARY. Seed role có thể chạy lại an toàn nếu dùng IF NOT EXISTS; migration CREATE TABLE không phải script có thể chạy lại trên schema đã tồn tại.


# 6. Lưu ý khi triển khai
Không đưa mật khẩu thật, JWT secret, khóa mã hóa hoặc dữ liệu định danh rõ vào repository/log.

Không thêm share_ratio vào asset_allocations.

Đối chiếu tên cột/kiểu dữ liệu trong tài liệu này với migration được merge.

Chạy V1 mới trên database sạch. Nếu V1 cũ đã chạy ở môi trường chia sẻ, tạo V2 để thay đổi schema và kiểm thử nâng cấp.

Trước khi merge, chạy focused tests, Maven checks và kiểm tra migration/trigger trên SQL Server thực tế.

Lưu ý mở rộng LegalDocument/LegalVerification: các bảng này là đề xuất thiết kế dựa trên quy trình pháp lý. Trước khi merge, cần chốt danh mục document_type, verification_status/result, quy tắc phân quyền verifier và việc có lưu tham chiếu đến phiên bản AssetVersion được xác minh hay không.


## Implementation notes before merge

- `legal_documents` is linked 1:0..1 to `assets`; `legal_verifications` stores multiple attempts for each legal document.
- A verification may optionally reference `asset_version_id` so a decision is tied to the exact version reviewed.
- Do not set `LEGAL_APPROVED` merely because upload succeeded.
- For PS-21, enforce at least one Beneficiary when completing the relevant configuration in the service layer/transaction.
- For PS-23, the scheduler may set `TRIGGERED` and the grace deadline only; it must not confirm death, unlock or decrypt assets.
- Verify actual column types and constraints against the V1 migration before treating this dictionary as the deployed schema.
