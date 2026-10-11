# LEGACYVAULT â€” PS-73 DATABASE SETUP GUIDE

**PhiÃªn báº£n:** v4 (Markdown)
**Pháº¡m vi:** Báº¯t Ä‘áº§u tá»« chuáº©n bá»‹ SQL Server/database, cÃ i Ä‘áº·t Flyway, cháº¡y migration, seed dá»¯ liá»‡u vÃ  kiá»ƒm tra hoÃ n táº¥t.

> **Má»¥c tiÃªu:** HÆ°á»›ng dáº«n thÃ nh viÃªn chuáº©n bá»‹ SQL Server database tÃªn `LegacyVault`, cáº¥u hÃ¬nh Backend Spring Boot, thÃªm Flyway vÃ o Maven, cháº¡y migration, náº¡p dá»¯ liá»‡u thá»­ nghiá»‡m vÃ  kiá»ƒm tra káº¿t quáº£.
>
> **LÆ°u Ã½:** Database dÃ¹ng chung tÃªn `LegacyVault`, nhÆ°ng `Server name`/`instance name` cÃ³ thá»ƒ khÃ¡c trÃªn tá»«ng mÃ¡y. KhÃ´ng sao chÃ©p nguyÃªn server name cá»§a thÃ nh viÃªn khÃ¡c; hÃ£y dÃ¹ng tÃªn instance mÃ  SSMS trÃªn chÃ­nh mÃ¡y báº¡n káº¿t ná»‘i Ä‘Æ°á»£c.

## 1. Chuáº©n bá»‹ SQL Server vÃ  database

### 1.1. Káº¿t ná»‘i SQL Server báº±ng SSMS

1. Má»Ÿ SQL Server Management Studio (SSMS).
2. Chá»n **Connect â†’ Database Engine**.
3. á»ž Ã´ **Server name**, nháº­p server/instance cá»§a chÃ­nh mÃ¡y báº¡n. VÃ­ dá»¥ minh há»a cÃ³ thá»ƒ lÃ  `.\\SQLEXPRESS`, `localhost\\SQLEXPRESS`, `TENMAY\\SQLEXPRESS` hoáº·c `localhost,1433`. CÃ¡c vÃ­ dá»¥ nÃ y khÃ´ng pháº£i tÃªn báº¯t buá»™c.
4. Chá»n **Windows Authentication** náº¿u SQL Server cá»§a báº¡n Ä‘Æ°á»£c cáº¥u hÃ¬nh xÃ¡c thá»±c báº±ng tÃ i khoáº£n Windows. Náº¿u mÃ´i trÆ°á»ng nhÃ³m Ä‘Æ°á»£c cáº¥u hÃ¬nh kiá»ƒu xÃ¡c thá»±c khÃ¡c, dÃ¹ng thÃ´ng tin do quáº£n trá»‹ viÃªn cung cáº¥p.
5. Nháº¥n **Connect**. Náº¿u khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c, xÃ¡c minh tÃªn instance vÃ  tráº¡ng thÃ¡i SQL Server service trÆ°á»›c khi tiáº¿p tá»¥c.

> **PhÃ¢n biá»‡t hai giÃ¡ trá»‹:** `Server name` trong SSMS lÃ  tÃªn/instance Ä‘á»ƒ káº¿t ná»‘i tá»›i SQL Server. `DB_URL` cá»§a á»©ng dá»¥ng Java cÃ³ thá»ƒ dÃ¹ng hostname vÃ  TCP port, vÃ­ dá»¥ `localhost:1433`. Hai chuá»—i nÃ y khÃ´ng nháº¥t thiáº¿t giá»‘ng nhau.

### 1.2. Kiá»ƒm tra mÃ¡y chá»§ Ä‘ang káº¿t ná»‘i

Sau khi káº¿t ná»‘i, má»Ÿ **New Query** vÃ  cháº¡y:

```sql
SELECT @@SERVERNAME AS server_name,
       DB_NAME() AS current_database,
       SUSER_SNAME() AS login_name;
GO

SELECT @@VERSION AS full_version,
       SERVERPROPERTY('Edition') AS edition,
       SERVERPROPERTY('ProductVersion') AS product_version,
       SERVERPROPERTY('InstanceName') AS instance_name;
```

LÆ°u láº¡i `server_name`, `instance_name` vÃ  `edition` thá»±c táº¿ Ä‘á»ƒ ghi vÃ o ticket PS-73. KhÃ´ng Ä‘iá»n tÃªn server cá»§a ngÆ°á»i khÃ¡c vÃ o tÃ i liá»‡u dÃ¹ng chung.

### 1.3. Kiá»ƒm tra database `LegacyVault`

```sql
SELECT name, state_desc
FROM sys.databases
WHERE name = N'LegacyVault';
```

Náº¿u káº¿t quáº£ cÃ³ database `LegacyVault` vÃ  tráº¡ng thÃ¡i `ONLINE`, kiá»ƒm tra Ä‘Ã³ cÃ³ Ä‘Ãºng lÃ  database phÃ¡t triá»ƒn báº¡n Ä‘Æ°á»£c phÃ©p sá»­ dá»¥ng. Náº¿u chÆ°a tá»“n táº¡i, chá»‰ táº¡o má»›i trÃªn SQL Server local/dev sau khi xÃ¡c nháº­n quyá»n vÃ  Ä‘Ãºng mÃ´i trÆ°á»ng.

Äá»ƒ táº¡o database má»›i trong SSMS: nháº¥p pháº£i **Databases â†’ New Databaseâ€¦ â†’ nháº­p `LegacyVault` â†’ OK**. Hoáº·c cháº¡y SQL sau khi Ä‘Ã£ xÃ¡c nháº­n Ä‘ang káº¿t ná»‘i Ä‘Ãºng server local/dev:

```sql
CREATE DATABASE [LegacyVault];
```

> **Cáº£nh bÃ¡o dá»¯ liá»‡u:** KhÃ´ng táº¡o database trÃ¹ng tÃªn trÃªn server dÃ¹ng chung vÃ  khÃ´ng xÃ³a/reset database Ä‘á»ƒ lÃ m theo hÆ°á»›ng dáº«n. Náº¿u `LegacyVault` Ä‘Ã£ tá»“n táº¡i, khÃ´ng cháº¡y `CREATE DATABASE` láº§n ná»¯a.

### 1.4. XÃ¡c Ä‘á»‹nh cá»•ng TCP náº¿u á»©ng dá»¥ng dÃ¹ng JDBC qua localhost

Náº¿u cáº¥u hÃ¬nh Backend sá»­ dá»¥ng `localhost:1433`, SQL Server pháº£i láº¯ng nghe trÃªn TCP port `1433`. Náº¿u mÃ¡y báº¡n dÃ¹ng cá»•ng khÃ¡c, hÃ£y dÃ¹ng cá»•ng thá»±c táº¿ trong `DB_URL`.

```sql
SELECT local_net_address, local_tcp_port, auth_scheme
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

Truy váº¥n nÃ y cÃ³ thá»ƒ khÃ´ng hiá»ƒn thá»‹ port mong Ä‘á»£i náº¿u káº¿t ná»‘i SSMS hiá»‡n táº¡i dÃ¹ng Shared Memory hoáº·c Named Pipes. Khi cáº§n, kiá»ƒm tra TCP/IP vÃ  port trong SQL Server Configuration Manager. Náº¿u thay Ä‘á»•i TCP/IP hoáº·c port, cÃ³ thá»ƒ cáº§n khá»Ÿi Ä‘á»™ng láº¡i SQL Server service. KhÃ´ng má»Ÿ cá»•ng SQL Server ra Internet.

### 1.5. Kiá»ƒm tra quyá»n database

Backend sáº½ cáº§n káº¿t ná»‘i vÃ o `LegacyVault`. TÃ i khoáº£n Windows cháº¡y IntelliJ pháº£i Ä‘Æ°á»£c SQL Server cho phÃ©p Ä‘Äƒng nháº­p vÃ  cÃ³ Ä‘á»§ quyá»n cho migration theo chÃ­nh sÃ¡ch nhÃ³m. Náº¿u SSMS káº¿t ná»‘i Ä‘Æ°á»£c nhÆ°ng á»©ng dá»¥ng khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c, xÃ¡c minh tÃ i khoáº£n thá»±c táº¿, `DB_URL`, TCP port vÃ  quyá»n database.

## 2. Láº¥y mÃ£ nguá»“n vÃ  má»Ÿ Backend

Náº¿u Ä‘Ã£ cÃ³ repository trÃªn mÃ¡y, chuyá»ƒn tá»›i thÆ° má»¥c Ä‘Ã³; khÃ´ng clone láº§n ná»¯a. Náº¿u chÆ°a cÃ³, clone repository:

```bash
git clone https://github.com/Abaddon8386/LegacyVault.git
cd LegacyVault
```

Kiá»ƒm tra branch trÆ°á»›c khi sá»­a/cháº¡y migration:

```bash
git status --short --branch
git fetch origin
git switch feature/PS-73-database-setup
git pull --ff-only origin feature/PS-73-database-setup
```

Náº¿u nhÃ³m Ä‘Ã£ giao branch khÃ¡c, sá»­ dá»¥ng branch Ä‘Æ°á»£c giao. Náº¿u cÃ³ thay Ä‘á»•i chÆ°a commit, dá»«ng láº¡i vÃ  kiá»ƒm tra chÃºng; khÃ´ng dÃ¹ng lá»‡nh xÃ³a thay Ä‘á»•i má»™t cÃ¡ch mÃ¡y mÃ³c.

1. Má»Ÿ IntelliJ IDEA â†’ **File â†’ Open** â†’ chá»n repository `LegacyVault`.
2. Má»Ÿ `backend/pom.xml` vÃ  chá» IntelliJ nháº­n diá»‡n Maven.
3. Má»Ÿ Maven tool window â†’ **Reload All Maven Projects**.
4. XÃ¡c nháº­n Project SDK/Maven runner dÃ¹ng phiÃªn báº£n JDK mÃ  dá»± Ã¡n yÃªu cáº§u (mÃ´i trÆ°á»ng hiá»‡n táº¡i Ä‘Ã£ sá»­ dá»¥ng Java 25).

## 3. CÃ i Ä‘áº·t Flyway cho Spring Boot

Trong dá»± Ã¡n nÃ y, Flyway Ä‘Æ°á»£c thÃªm nhÆ° dependency Maven vÃ  cháº¡y cÃ¹ng Backend Spring Boot. KhÃ´ng cáº§n cÃ i má»™t chÆ°Æ¡ng trÃ¬nh Flyway CLI riÃªng Ä‘á»ƒ cháº¡y migration khi á»©ng dá»¥ng Ä‘Ã£ Ä‘Æ°á»£c cáº¥u hÃ¬nh tÃ­ch há»£p Flyway.

### 3.1. ThÃªm dependency vÃ o `backend/pom.xml`

1. Má»Ÿ `backend/pom.xml`.
2. TÃ¬m pháº§n `<dependencies>`.
3. ThÃªm hai dependency dÆ°á»›i Ä‘Ã¢y bÃªn trong `<dependencies>`. TrÆ°á»›c khi thÃªm, kiá»ƒm tra xem chÃºng Ä‘Ã£ cÃ³ chÆ°a Ä‘á»ƒ trÃ¡nh khai bÃ¡o trÃ¹ng.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-sqlserver</artifactId>
</dependency>
```

Giá»¯ nguyÃªn cáº¥u trÃºc vÃ  cÃ¡c dependency hiá»‡n cÃ³. Náº¿u nhÃ³m Ä‘Ã£ quáº£n lÃ½ dependency version báº±ng Spring Boot BOM, khÃ´ng tá»± thÃªm version riÃªng trá»« khi Maven bÃ¡o cáº§n thiáº¿t theo cáº¥u hÃ¬nh dá»± Ã¡n.

### 3.2. Táº£i dependency Flyway

1. LÆ°u `backend/pom.xml`.
2. Trong IntelliJ, má»Ÿ Maven tool window vÃ  chá»n **Reload All Maven Projects**.
3. Chá» Maven táº£i dependency. Kiá»ƒm tra cá»­a sá»• Build/Maven Ä‘á»ƒ cháº¯c cháº¯n khÃ´ng cÃ³ lá»—i resolve artifact.
4. CÃ³ thá»ƒ kiá»ƒm tra trong terminal táº¡i thÆ° má»¥c `backend` báº±ng lá»‡nh:

```bash
mvn dependency:tree
```

Náº¿u mÃ¡y khÃ´ng nháº­n lá»‡nh `mvn`, dÃ¹ng Maven wrapper náº¿u repository cÃ³ `mvnw.cmd`, hoáº·c cáº¥u hÃ¬nh Maven trong IntelliJ. KhÃ´ng táº£i JAR ngáº«u nhiÃªn tá»« website khÃ´ng Ä‘Ã¡ng tin cáº­y.

### 3.3. Vá»‹ trÃ­ file migration

Cáº¥u hÃ¬nh Ä‘ang Ä‘Æ°á»£c hÆ°á»›ng dáº«n cho dá»± Ã¡n dÃ¹ng thÆ° má»¥c migration á»Ÿ root repository:

```text
LegacyVault/
â”œâ”€â”€ backend/
â”‚   â””â”€â”€ pom.xml
â””â”€â”€ database/
    â”œâ”€â”€ migration/
    â”‚   â””â”€â”€ V1__create_initial_schema.sql
    â””â”€â”€ seed/
        â””â”€â”€ seed_test_data.sql
```

TÃªn file vÃ­ dá»¥ minh há»a quy táº¯c Ä‘áº·t tÃªn Flyway: `V` + phiÃªn báº£n + hai dáº¥u gáº¡ch dÆ°á»›i + mÃ´ táº£ + `.sql`. DÃ¹ng file migration tháº­t Ä‘ang cÃ³ trong branch, khÃ´ng táº¡o file trÃ¹ng phiÃªn báº£n Ä‘Ã£ tá»“n táº¡i.

### 3.4. Cáº¥u hÃ¬nh Flyway trong `application.yaml`

Má»Ÿ `backend/src/main/resources/application.yaml`. Giá»¯ cÃ¡c cáº¥u hÃ¬nh hiá»‡n cÃ³ vÃ  xÃ¡c nháº­n cÃ³ cÃ¡c pháº§n tÆ°Æ¡ng Ä‘Æ°Æ¡ng sau:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
  flyway:
    enabled: true
    locations: filesystem:../database/migration
  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.SQLServerDialect
```

Quan trá»ng: `filesystem:../database/migration` lÃ  Ä‘Æ°á»ng dáº«n tÆ°Æ¡ng Ä‘á»‘i vá»›i **Working directory** khi cháº¡y á»©ng dá»¥ng. Vá»›i Working directory lÃ  thÆ° má»¥c `backend`, Ä‘Æ°á»ng dáº«n nÃ y trá» tá»›i `database/migration` á»Ÿ root repository. Náº¿u Working directory khÃ¡c, hÃ£y Ä‘iá»u chá»‰nh Ä‘Æ°á»ng dáº«n cho Ä‘Ãºng hoáº·c thá»‘ng nháº¥t Working directory trong Run Configuration.

> **KhÃ´ng Ä‘á»ƒ Hibernate tá»± táº¡o schema:** Giá»¯ `spring.jpa.hibernate.ddl-auto: none`. Flyway quáº£n lÃ½ migration; khÃ´ng Ä‘á»•i sang `create/update` Ä‘á»ƒ nÃ© lá»—i.

## 4. Cáº¥u hÃ¬nh káº¿t ná»‘i Backend tá»›i `LegacyVault`

### 4.1. Cáº¥u hÃ¬nh `DB_URL`

Trong IntelliJ, má»Ÿ **Run â†’ Edit Configurations â†’ chá»n cáº¥u hÃ¬nh Spring Boot â†’ Environment variables**. ThÃªm biáº¿n `DB_URL`. Vá»›i SQL Server local Ä‘Ã£ cáº¥u hÃ¬nh TCP port `1433` vÃ  Windows Integrated Authentication, giÃ¡ trá»‹ máº«u lÃ :

```text
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=LegacyVault;encrypt=true;trustServerCertificate=true;integratedSecurity=true
```

Database name pháº£i lÃ  `LegacyVault`. Náº¿u SQL Server cá»§a báº¡n khÃ´ng láº¯ng nghe á»Ÿ `localhost:1433`, thay hostname/port báº±ng endpoint thá»±c táº¿. Server name cá»§a má»—i thÃ nh viÃªn cÃ³ thá»ƒ khÃ¡c; khÃ´ng chÃ©p nguyÃªn tÃªn mÃ¡y/instance cá»§a ngÆ°á»i khÃ¡c.

Náº¿u dÃ¹ng Windows Integrated Authentication, tÃ i khoáº£n cháº¡y á»©ng dá»¥ng pháº£i cÃ³ quyá»n trÃªn SQL Server. Náº¿u nhÃ³m dÃ¹ng SQL Authentication thay vÃ¬ Windows Authentication, cáº§n cáº¥u hÃ¬nh username/password theo quy Ä‘á»‹nh nhÃ³m vÃ  khÃ´ng commit thÃ´ng tin Ä‘Äƒng nháº­p vÃ o Git.

### 4.2. XÃ¡c nháº­n Working directory

1. Trong **Run â†’ Edit Configurations**, tÃ¬m trÆ°á»ng **Working directory**.
2. Äáº·t Working directory theo cáº¥u trÃºc repository vÃ  Ä‘áº£m báº£o Ä‘Æ°á»ng dáº«n `filesystem:../database/migration` trá» Ä‘Ãºng thÆ° má»¥c `database/migration`.
3. LÆ°u cáº¥u hÃ¬nh. Náº¿u á»©ng dá»¥ng bÃ¡o khÃ´ng tÃ¬m tháº¥y migration, kiá»ƒm tra má»¥c nÃ y trÆ°á»›c.

### 4.3. XÃ¡c minh database trÆ°á»›c khi cháº¡y

Trong SSMS, cháº¡y:

```sql
SELECT DB_NAME() AS current_database,
       SUSER_SNAME() AS login_name;
```

Náº¿u cáº§n, chá»n database Ä‘Ãºng báº±ng:

```sql
USE [LegacyVault];
GO
```

XÃ¡c nháº­n `DB_NAME()` tráº£ vá» `LegacyVault` khi cháº¡y cÃ¡c truy váº¥n kiá»ƒm tra. LuÃ´n kiá»ƒm tra server vÃ  database trÆ°á»›c khi cháº¡y script thay Ä‘á»•i dá»¯ liá»‡u.

## 5. Cháº¡y Flyway migration

### 5.1. Kiá»ƒm tra migration hiá»‡n cÃ³

1. Má»Ÿ `database/migration` vÃ  xem file migration Ä‘Ã£ commit trÃªn branch.
2. KhÃ´ng sá»­a file migration Ä‘Ã£ Ä‘Æ°á»£c Ã¡p dá»¥ng trÃªn database dÃ¹ng chung; náº¿u cáº§n thay Ä‘á»•i schema, táº¡o migration phiÃªn báº£n tiáº¿p theo theo quy Æ°á»›c nhÃ³m.
3. Äáº£m báº£o dependency Flyway Ä‘Ã£ táº£i thÃ nh cÃ´ng vÃ  `DB_URL`/Working directory Ä‘Ãºng.

### 5.2. Cháº¡y á»©ng dá»¥ng

1. Má»Ÿ lá»›p main cá»§a Spring Boot trong `backend`.
2. Nháº¥n **Run** vá»›i cáº¥u hÃ¬nh Ä‘Ã£ khai bÃ¡o `DB_URL`.
3. Theo dÃµi log. Flyway sáº½ kiá»ƒm tra lá»‹ch sá»­ migration vÃ  Ã¡p dá»¥ng migration chÆ°a cháº¡y.
4. Náº¿u cÃ³ lá»—i káº¿t ná»‘i hoáº·c migration, dá»«ng táº¡i Ä‘Ã¢y vÃ  xá»­ lÃ½ lá»—i trÆ°á»›c khi cháº¡y seed.

### 5.3. Kiá»ƒm tra lá»‹ch sá»­ migration

```sql
USE [LegacyVault];
GO

SELECT installed_rank, version, description, type, script,
       installed_on, success
FROM dbo.flyway_schema_history
ORDER BY installed_rank;
```

Káº¿t quáº£ mong Ä‘á»£i: migration Ä‘Ã£ cháº¡y Ä‘Æ°á»£c ghi trong `flyway_schema_history` vÃ  `success = 1`. Náº¿u báº£ng khÃ´ng tá»“n táº¡i, xÃ¡c nháº­n Ä‘Ãºng database, `flyway.locations` vÃ  log khá»Ÿi Ä‘á»™ng. KhÃ´ng tá»± táº¡o báº£ng lá»‹ch sá»­ Flyway báº±ng tay.

### 5.4. Kiá»ƒm tra cÃ¡c báº£ng

```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

CÃ¡c báº£ng nghiá»‡p vá»¥ Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n trong schema hiá»‡n táº¡i gá»“m `users`, `roles`, `user_roles`, `vaults`, `assets`, `beneficiaries`, `asset_allocations`, `trustees`, `dms_configs`, `vitality_check_logs` vÃ  `audit_logs`. Danh sÃ¡ch thá»±c táº¿ pháº£i Ä‘Æ°á»£c xÃ¡c nháº­n báº±ng truy váº¥n trÃªn database cá»§a báº¡n; cÃ³ thá»ƒ xuáº¥t hiá»‡n thÃªm báº£ng metadata Flyway.

### 5.5. NguyÃªn táº¯c migration khi lÃ m nhÃ³m

- KhÃ´ng cháº¡y script reset hoáº·c xÃ³a database trong quy trÃ¬nh setup.
- KhÃ´ng sá»­a migration Ä‘Ã£ cháº¡y trÃªn database dÃ¹ng chung; táº¡o migration phiÃªn báº£n má»›i.
- KhÃ´ng táº¡o file migration cÃ³ version trÃ¹ng vá»›i file Ä‘Ã£ tá»“n táº¡i.
- KhÃ´ng dÃ¹ng `spring.jpa.hibernate.ddl-auto=create/update` Ä‘á»ƒ thay tháº¿ Flyway.
- LÆ°u log thÃ nh cÃ´ng vÃ  káº¿t quáº£ `flyway_schema_history` vÃ o ticket PS-73.

## 6. Náº¡p dá»¯ liá»‡u thá»­ nghiá»‡m (seed)

Chá»‰ thá»±c hiá»‡n sau khi migration thÃ nh cÃ´ng. Dá»¯ liá»‡u seed phá»¥c vá»¥ kiá»ƒm thá»­, khÃ´ng pháº£i dá»¯ liá»‡u tháº­t.

1. Má»Ÿ `database/seed/seed_test_data.sql` vÃ  Ä‘á»c script trÆ°á»›c khi cháº¡y.
2. Náº¿u script yÃªu cáº§u BCrypt hash, thay placeholder báº±ng hash Ä‘Æ°á»£c táº¡o cho máº­t kháº©u demo; khÃ´ng dÃ¹ng máº­t kháº©u cÃ¡ nhÃ¢n vÃ  khÃ´ng commit máº­t kháº©u rÃµ.
3. Trong SSMS, xÃ¡c nháº­n Ä‘ang káº¿t ná»‘i Ä‘Ãºng SQL Server vÃ  database `LegacyVault`.
4. Má»Ÿ script seed, cháº¡y vÃ  Ä‘á»c tab **Messages/Results**. Náº¿u cÃ³ lá»—i, khÃ´ng cháº¡y láº·p láº¡i ngay; kiá»ƒm tra xem dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c thÃªm má»™t pháº§n hay chÆ°a.
5. XÃ¡c minh dá»¯ liá»‡u báº±ng truy váº¥n:

```sql
USE [LegacyVault];
GO

SELECT 'users' AS table_name, COUNT_BIG(*) AS row_count FROM dbo.users
UNION ALL SELECT 'vaults', COUNT_BIG(*) FROM dbo.vaults
UNION ALL SELECT 'assets', COUNT_BIG(*) FROM dbo.assets
UNION ALL SELECT 'beneficiaries', COUNT_BIG(*) FROM dbo.beneficiaries
UNION ALL SELECT 'trustees', COUNT_BIG(*) FROM dbo.trustees
UNION ALL SELECT 'asset_allocations', COUNT_BIG(*) FROM dbo.asset_allocations
UNION ALL SELECT 'dms_configs', COUNT_BIG(*) FROM dbo.dms_configs
UNION ALL SELECT 'vitality_check_logs', COUNT_BIG(*) FROM dbo.vitality_check_logs;
```

CÃ¡c báº£n ghi Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n trÆ°á»›c Ä‘Ã¢y gá»“m má»™t Owner thá»­ nghiá»‡m, má»™t Vault, hai Assets, hai Beneficiaries vÃ  hai Asset Allocations. CÃ¡c báº£ng Trustee, DMS config vÃ  vitality log cáº§n Ä‘Æ°á»£c xÃ¡c nháº­n báº±ng káº¿t quáº£ thá»±c táº¿.

> **Giá»›i háº¡n seed:** `encrypted_payload` vÃ  `encryption_iv` trong dá»¯ liá»‡u thá»­ nghiá»‡m lÃ  byte giáº£, khÃ´ng pháº£i payload Ä‘Ã£ Ä‘Æ°á»£c mÃ£ hÃ³a tháº­t vÃ  khÃ´ng thá»ƒ dÃ¹ng Ä‘á»ƒ chá»©ng minh luá»“ng giáº£i mÃ£.

## 7. Kiá»ƒm tra roles vÃ  Admin

### 7.1. Kiá»ƒm tra roles

```sql
SELECT role_id, role_code, role_name
FROM dbo.roles
ORDER BY role_id;
```

CÃ¡c role code Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n: `ROLE_VAULT_OWNER`, `ROLE_STAFF_EXECUTOR`, `ROLE_LEGAL_VERIFIER`, `ROLE_ADMIN` vÃ  `ROLE_BENEFICIARY`.

### 7.2. Kiá»ƒm tra tÃ i khoáº£n Ä‘Æ°á»£c gÃ¡n `ROLE_ADMIN`

```sql
SELECT u.user_id, u.full_name, u.email, u.status, r.role_code
FROM dbo.users u
JOIN dbo.user_roles ur ON ur.user_id = u.user_id
JOIN dbo.roles r ON r.role_id = ur.role_id
WHERE r.role_code = 'ROLE_ADMIN';
```

Theo schema hiá»‡n táº¡i, cá»™t ghi nháº­n ngÆ°á»i gÃ¡n role lÃ  `assigned_by_user_id`, khÃ´ng pháº£i `assigned_by`. TÃ i khoáº£n Admin Ä‘Ã£ Ä‘Æ°á»£c táº¡o trÆ°á»›c Ä‘Ã³; kiá»ƒm tra trÆ°á»›c khi táº¡o thÃªm. CÃ³ báº£n ghi role khÃ´ng tá»± chá»©ng minh chá»©c nÄƒng Ä‘Äƒng nháº­p Ä‘Ã£ hoáº¡t Ä‘á»™ng. ChÃ­nh sÃ¡ch bootstrap Admin lÃ¢u dÃ i váº«n cáº§n nhÃ³m thá»‘ng nháº¥t.

## 8. Kiá»ƒm tra khÃ³a vÃ  quan há»‡

### 8.1. Foreign keys

```sql
SELECT fk.name AS foreign_key_name,
       OBJECT_NAME(fk.parent_object_id) AS table_name,
       COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS column_name,
       OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
       COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc
  ON fk.object_id = fkc.constraint_object_id
ORDER BY table_name, foreign_key_name;
```

### 8.2. Primary keys vÃ  unique indexes

```sql
SELECT t.name AS table_name, i.name AS index_name,
       i.is_unique, i.is_primary_key
FROM sys.tables t
JOIN sys.indexes i ON i.object_id = t.object_id
WHERE i.is_unique = 1 OR i.is_primary_key = 1
ORDER BY t.name, i.name;
```

### 8.3. Kiá»ƒm tra má»™t sá»‘ quan há»‡

```sql
SELECT v.vault_id, v.owner_user_id
FROM dbo.vaults v
LEFT JOIN dbo.users u ON u.user_id = v.owner_user_id
WHERE u.user_id IS NULL;

SELECT a.asset_id, a.vault_id
FROM dbo.assets a
LEFT JOIN dbo.vaults v ON v.vault_id = a.vault_id
WHERE v.vault_id IS NULL;
```

CÃ¡c truy váº¥n trÃªn ká»³ vá»ng khÃ´ng tráº£ vá» dÃ²ng nÃ o. Náº¿u cÃ³ dÃ²ng, lÆ°u káº¿t quáº£ vÃ  xÃ¡c minh nguyÃªn nhÃ¢n trÆ°á»›c khi sá»­a dá»¯ liá»‡u.

## 9. Xá»­ lÃ½ lá»—i thÆ°á»ng gáº·p

| Lá»—i/triá»‡u chá»©ng | NguyÃªn nhÃ¢n cÃ³ thá»ƒ | CÃ¡ch xá»­ lÃ½ Ä‘áº§u tiÃªn |
|---|---|---|
| SSMS khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c | Server name/instance sai hoáº·c service dá»«ng. | XÃ¡c nháº­n tÃªn instance trÃªn mÃ¡y, SQL Server service vÃ  authentication. |
| `DB_URL is not set` | ChÆ°a khai bÃ¡o biáº¿n mÃ´i trÆ°á»ng. | ThÃªm `DB_URL` trong IntelliJ Run Configuration. |
| `Connection refused` | TCP/IP táº¯t hoáº·c port sai. | Kiá»ƒm tra TCP/IP, port thá»±c táº¿ vÃ  endpoint trong `DB_URL`. |
| `Login failed for user` | TÃ i khoáº£n cháº¡y á»©ng dá»¥ng khÃ´ng cÃ³ quyá»n. | So sÃ¡nh tÃ i khoáº£n Windows cá»§a SSMS/IntelliJ vÃ  yÃªu cáº§u quáº£n trá»‹ viÃªn cáº¥p quyá»n. |
| `Cannot open database LegacyVault` | Database khÃ´ng tá»“n táº¡i/offline hoáº·c thiáº¿u quyá»n. | Kiá»ƒm tra `sys.databases` vÃ  quyá»n; khÃ´ng táº¡o database trÃªn server chia sáº» náº¿u chÆ°a Ä‘Æ°á»£c phÃ©p. |
| Flyway khÃ´ng tÃ¬m tháº¥y migration | `flyway.locations` sai hoáº·c Working directory sai. | XÃ¡c minh Ä‘Æ°á»ng dáº«n `database/migration` vÃ  Run Configuration. |
| Flyway checksum mismatch | File migration Ä‘Ã£ cháº¡y bá»‹ sá»­a. | KhÃ´ng sá»­a metadata thá»§ cÃ´ng; khÃ´i phá»¥c migration Ä‘Ã£ commit hoáº·c thá»‘ng nháº¥t migration má»›i vá»›i nhÃ³m. |
| `Invalid object name` | Migration chÆ°a cháº¡y hoáº·c Ä‘ang query nháº§m database/schema. | Kiá»ƒm tra `DB_NAME()`, `flyway_schema_history` vÃ  danh sÃ¡ch báº£ng. |
| `Invalid column name assigned_by` | DÃ¹ng tÃªn cá»™t cÅ©. | DÃ¹ng `assigned_by_user_id` theo schema hiá»‡n táº¡i. |
| Maven khÃ´ng táº£i Ä‘Æ°á»£c Flyway | Maven chÆ°a reload, máº¡ng/repository hoáº·c POM lá»—i. | Reload Maven, xem lá»—i Ä‘áº§u tiÃªn trong Build output; kiá»ƒm tra artifact/dependency vÃ  khÃ´ng thÃªm dependency trÃ¹ng. |
| Seed duplicate key | Dá»¯ liá»‡u Ä‘Ã£ tá»“n táº¡i hoáº·c script khÃ´ng idempotent. | Dá»«ng, kiá»ƒm tra dá»¯ liá»‡u theo khÃ³a Ä‘á»‹nh danh vÃ  Ä‘á»c script trÆ°á»›c khi cháº¡y láº¡i. |

## 10. Checklist hoÃ n táº¥t PS-73

- [ ] ÄÃ£ káº¿t ná»‘i Ä‘Ãºng SQL Server trÃªn mÃ¡y cÃ¡ nhÃ¢n; server/instance name Ä‘Æ°á»£c ghi nháº­n tá»« mÃ´i trÆ°á»ng thá»±c táº¿.
- [ ] Database `LegacyVault` tá»“n táº¡i vÃ  á»Ÿ tráº¡ng thÃ¡i `ONLINE`.
- [ ] `backend/pom.xml` cÃ³ dependency Flyway cáº§n thiáº¿t, khÃ´ng bá»‹ khai bÃ¡o trÃ¹ng.
- [ ] Maven táº£i dependency thÃ nh cÃ´ng.
- [ ] `application.yaml` báº­t Flyway vÃ  `flyway.locations` trá» Ä‘Ãºng thÆ° má»¥c migration.
- [ ] `DB_URL` trá» Ä‘Ãºng endpoint SQL Server vÃ  `databaseName=LegacyVault`.
- [ ] `spring.jpa.hibernate.ddl-auto` váº«n lÃ  `none`.
- [ ] Backend khá»Ÿi Ä‘á»™ng vÃ  Flyway migration cháº¡y thÃ nh cÃ´ng.
- [ ] `flyway_schema_history` ghi nháº­n migration `success = 1`.
- [ ] Danh sÃ¡ch báº£ng, roles, dá»¯ liá»‡u seed vÃ  khÃ³a/quan há»‡ Ä‘Ã£ Ä‘Æ°á»£c kiá»ƒm tra.
- [ ] KhÃ´ng cÃ³ máº­t kháº©u, token, key hoáº·c dá»¯ liá»‡u cÃ¡ nhÃ¢n tháº­t trong Git/tÃ i liá»‡u.
- [ ] ÄÃ£ lÆ°u log/áº£nh chá»¥p/káº¿t quáº£ SQL cáº§n thiáº¿t vÃ o ticket PS-73 hoáº·c vá»‹ trÃ­ nhÃ³m thá»‘ng nháº¥t.

### Äiá»u kiá»‡n Ä‘á» xuáº¥t Ä‘Ã³ng cÃ´ng viá»‡c

Äá» xuáº¥t hoÃ n táº¥t pháº§n database setup khi thÃ nh viÃªn khÃ¡c cÃ³ thá»ƒ lÃ m theo tÃ i liá»‡u trÃªn mÃ¡y cá»§a mÃ¬nh, káº¿t ná»‘i Ä‘Ãºng database `LegacyVault`, cháº¡y Flyway thÃ nh cÃ´ng, xÃ¡c nháº­n schema vÃ  seed dá»¯ liá»‡u giáº£, Ä‘á»“ng thá»i cung cáº¥p báº±ng chá»©ng. Migration thÃ nh cÃ´ng khÃ´ng Ä‘á»“ng nghÄ©a cÃ¡c chá»©c nÄƒng Ä‘Äƒng nháº­p, giáº£i mÃ£ payload, DMS scheduler hoáº·c luá»“ng bÃ n giao Ä‘Ã£ Ä‘Æ°á»£c kiá»ƒm thá»­.

## TÃ i liá»‡u tham kháº£o chÃ­nh thá»©c

- SQL Server downloads: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- SSMS downloads: https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms
- Flyway documentation: https://documentation.red-gate.com/flyway
- Spring Boot documentation: https://docs.spring.io/spring-boot/
