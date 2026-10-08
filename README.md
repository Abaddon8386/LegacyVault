# LegacyVault

Repo chính của nhóm: https://github.com/Abaddon8386/LegacyVault. Hướng dẫn này phục vụ **PS-75**, chạy môi trường phát triển Sprint 1 trên Windows/PowerShell.

## Stack và tình trạng hiện tại

| Thành phần | Đã có trong repo |
| --- | --- |
| Frontend | React, JavaScript, Vite; có `package-lock.json` |
| Backend | Java 25, Spring Boot 4.1.1, Maven Wrapper |
| Database | Microsoft SQL Server; JDBC 13.6.0.jre11, Spring Data JPA |
| API nghiệp vụ | Chưa có; Dương bổ sung theo PS-74 và ticket chức năng |
| Migration/seed | Chưa có; Long bổ sung theo PS-73 |

SQL Server là DB đã chốt. Hậu tố `jre11` của JDBC không có nghĩa nhóm phải dùng Java 11.

README này là khung có thể kiểm tra phần scaffold. **Chưa xác nhận một thành viên khác chạy thành công từ bản clone mới; chưa xác nhận FE → API → SQL Server.** Ghi kết quả tại [checklist PS-75](docs/PS-75_SETUP_CHECKLIST.md).

## Cấu trúc

```text
frontend/   React/Vite và cấu hình frontend
backend/    Spring Boot, Maven Wrapper và kiểm thử backend
database/   Nơi bổ sung migration, seed và hướng dẫn DB (PS-73)
docs/       Tài liệu nhóm, API contract và bằng chứng kiểm tra
scripts/    Nơi bổ sung script hỗ trợ nếu cần
```

`database/` và `scripts/` hiện chỉ có `.gitkeep`. Không có lệnh migration/seed để chạy ở thời điểm viết khung.

## 1. Chuẩn bị môi trường

- Git.
- JDK **25**; `JAVA_HOME` và `PATH` phải trỏ đúng JDK.
- Node.js và npm tương thích Vite trong `frontend/package.json`. Máy viết hướng dẫn có Node **24.18.0**, npm **11.16.0**; nhóm cần kiểm tra lại trên máy người chạy thử.
- SQL Server và công cụ quản lý như SSMS. **Long cần chốt phiên bản/edition, instance, cổng và cách xác thực trong PS-73.** SSMS là công cụ kết nối, không thay thế SQL Server engine.
- Internet cho lần đầu tải dependency Maven/npm. Không cần cài Maven riêng vì repo có wrapper.

Kiểm tra trước khi chạy:

```powershell
git --version
java -version
node --version
npm --version
```

Đối chiếu yêu cầu tại [Vite](https://vite.dev/guide/) và [Spring Boot](https://docs.spring.io/spring-boot/system-requirements.html) khi nâng phiên bản. Dependency thực tế được xác định bởi `pom.xml`, `package.json` và lockfile.

## 2. Lấy code và tạo nhánh làm việc

```powershell
git clone --branch develop https://github.com/Abaddon8386/LegacyVault.git
cd LegacyVault
git switch -c docs/PS-75-readme
```

Ví dụ nhánh chức năng: `feature/PS-1-register-ui`. Mỗi người tạo nhánh cho ticket mình nhận, tạo PR vào `develop` và nhờ thành viên khác review. Không đưa mật khẩu, dữ liệu cá nhân hay file backup DB lên Git.

Nếu đã có repo, kiểm tra `git status` trước khi chuyển nhánh; xử lý thay đổi đang làm rồi mới cập nhật `develop` bằng `git pull --ff-only`.

## 3. Chuẩn bị SQL Server

Hiện `backend/src/main/resources/application.yaml` dùng Windows Authentication:

```text
jdbc:sqlserver://ABADDON:1433;databaseName=LegacyVault;encrypt=true;trustServerCertificate=true;integratedSecurity=true
```

`ABADDON` là tên máy trong cấu hình hiện tại. Máy thành viên khác phải dùng tên server/cổng của mình bằng biến môi trường, không cần sửa cấu hình chung.

1. Kiểm tra SQL Server engine đang chạy; bật TCP/IP và xác định cổng thực tế. Ví dụ bên dưới dùng `localhost:1433`; chỉ dùng nếu instance đã cấu hình đúng cổng này. Với named instance, không mặc định cổng là 1433.
2. Kết nối bằng SSMS với cùng tài khoản Windows sẽ chạy backend. Tài khoản đó phải có quyền truy cập DB.
3. Nếu chưa có DB trên môi trường local, chạy đoạn sau trong SSMS. Đoạn này chỉ tạo DB trống, chưa tạo bảng nghiệp vụ:

```sql
IF DB_ID(N'LegacyVault') IS NULL
    EXEC(N'CREATE DATABASE [LegacyVault]');
GO
```

4. Với `integratedSecurity=true`, cài thư viện native authentication đi kèm Microsoft JDBC Driver **đúng phiên bản và kiến trúc JVM**, rồi đưa thư mục chứa DLL vào `PATH` trước khi mở terminal chạy backend. Thư viện Java JDBC trong Maven không tự cung cấp DLL cho Windows.
5. Khi PS-73 hoàn tất, Long bổ sung vị trí migration, thứ tự chạy, seed và cách xác minh schema vào phần bên dưới.

Tham khảo chính thức: [kết nối và Integrated Authentication của Microsoft JDBC](https://learn.microsoft.com/en-us/sql/connect/jdbc/building-the-connection-url?view=azuresqldb-mi-current).

### Phần Long cần hoàn tất — PS-73

- Phiên bản/edition SQL Server, instance/cổng và phương thức xác thực thống nhất.
- Đường dẫn migration, lệnh chạy và cơ chế ghi nhận phiên bản schema.
- Lệnh seed dữ liệu thử; cách tạo Admin đầu tiên theo quyết định onboarding của nhóm.
- Kiểm tra bảng/khóa/quan hệ và hướng dẫn reset **chỉ cho DB thử nghiệm**.

Hiện `ddl-auto: none`: Spring Boot không tự tạo schema. Không đổi sang `create` để thay thế migration.

## 4. Chạy backend

Mở terminal PowerShell từ thư mục repo:

```powershell
cd backend
$env:SPRING_DATASOURCE_URL = 'jdbc:sqlserver://localhost:1433;databaseName=LegacyVault;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd -version
.\mvnw.cmd spring-boot:run
```

Điều chỉnh server/cổng trước khi chạy. Biến môi trường trên chỉ áp dụng cho terminal hiện tại và được ưu tiên hơn URL trong YAML. Spring Boot không tự đọc file `.env`; không chỉ tạo `.env` rồi cho rằng backend đã nhận cấu hình.

`trustServerCertificate=true` trong ví dụ dùng cho local. Khi deploy, cần cấu hình chứng chỉ và xác minh TLS phù hợp; không sao chép nguyên cấu hình local.

Kết quả mong đợi: log báo ứng dụng đã khởi động và không có lỗi kết nối DB. Địa chỉ mặc định: **http://localhost:8080** nếu không đặt `SERVER_PORT`.

Backend hiện có Spring Security nhưng chưa có API nghiệp vụ/security contract. Gặp màn hình đăng nhập hoặc HTTP 401 không đủ chứng minh API đã hoàn thành; không vô hiệu hóa security chỉ để vượt qua kiểm tra.

### Kiểm tra backend

Trong terminal khác, vào `backend/`, đặt cùng biến DB rồi chạy:

```powershell
.\mvnw.cmd test
.\mvnw.cmd verify
```

Test hiện có tải Spring context nên có thể cần SQL Server truy cập được. `verify` bao gồm pha test; nếu test lỗi, xử lý nguyên nhân trước khi chạy lại. Build/test thành công chưa thay thế kiểm tra nghiệp vụ.

## 5. Chạy frontend

Mở terminal khác từ thư mục repo:

```powershell
cd frontend
npm ci
npm run dev
```

Mở URL Vite in trong terminal, thường là **http://localhost:5173**. Nếu cổng đã dùng, Vite có thể chọn cổng khác; ghi đúng URL trong checklist.

Kiểm tra frontend:

```powershell
npm run lint
npm run build
npm run preview
```

`preview` dùng để xem bản build local, không phải cấu hình deploy production. Dừng server bằng `Ctrl+C`.

## 6. Kiểm tra FE → API → SQL Server

**Chờ PS-73/PS-74 và một API chức năng để thực hiện phần này.** Hiện `vite.config.js` chưa có proxy; backend chưa có CORS/API contract. Chỉ chạy hai server không có nghĩa FE gọi được BE.

Dương bổ sung: API base URL, endpoint smoke test có thật, request/response mẫu, xác thực, CORS hoặc proxy đã chọn và định dạng lỗi chung. Không đặt secret trong biến `VITE_*` vì các biến này có thể xuất hiện trong mã frontend.

Khi có đủ phần tích hợp, người kiểm tra:

1. Chạy migration/seed theo PS-73 trên DB thử nghiệm.
2. Chạy backend và kiểm tra endpoint theo PS-74 với quyền phù hợp.
3. Thao tác trên FE, kiểm tra request/response trong trình duyệt.
4. Đối chiếu dữ liệu được ghi/đọc trong SQL Server theo chức năng thử.
5. Lưu kết quả, phiên bản commit, môi trường và lỗi còn lại vào checklist. Không đưa token/mật khẩu vào bằng chứng.

## 7. Lỗi thường gặp

| Triệu chứng | Cần kiểm tra |
| --- | --- |
| `java -version` khác 25 | JDK, `JAVA_HOME`, `PATH`; mở lại terminal sau khi đổi |
| npm báo engine/dependency | Phiên bản Node theo yêu cầu dependency; dùng `npm ci` với lockfile |
| SQL connection refused/timeout | SQL service, TCP/IP, server/cổng, firewall và URL thực tế |
| Driver báo không hỗ trợ integrated authentication | DLL native đúng phiên bản/kiến trúc và `PATH` của terminal |
| Cannot open database/Login failed | DB đã tồn tại; tài khoản chạy Java có quyền kết nối DB |
| Invalid object name | Migration chưa chạy hoặc kết nối sai DB; `ddl-auto` không tạo bảng |
| Cổng 8080 đang dùng | Dừng tiến trình cũ hoặc đặt `SERVER_PORT`; cập nhật FE/API URL tương ứng |
| HTTP 401/403 | 401: thiếu/sai xác thực; 403: quyền hoặc chính sách security như CSRF; kiểm tra contract và log |
| Trình duyệt báo CORS | Đối chiếu origin FE thực tế với CORS/proxy do PS-74 cung cấp |

## 8. Review và hoàn tất PS-75

Thái tổng hợp README; Long cung cấp DB; Dương cung cấp API/cấu hình tích hợp; đề xuất Huy làm người thử từ clone mới. Nhóm xác nhận người thử thực tế trong checklist.

Chỉ đánh dấu PS-75 Done khi hướng dẫn khớp code, phần DB/API được bổ sung, một thành viên khác chạy lại thành công có bằng chứng và PR được review/merge theo quy trình nhóm. Hiện các mục chưa làm phải để **Chưa kiểm tra/Đang chờ**, không tự đánh dấu đạt.
