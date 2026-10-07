# HTX Lam Hong

Spring Boot 3 application with a static HTML/CSS/JavaScript frontend and a MySQL backend.

## Project structure

```text
src/main/java/                 Backend application code
src/main/resources/static/     Web pages and public assets served by Spring Boot
src/main/resources/            Runtime configuration
src/test/                      Automated tests
deploy/cpanel/                 cPanel-specific deployment overlay
tools/                         Maintenance and migration scripts
docs/                          Project reference documents
```

`src/main/resources/static` is the canonical frontend. Build the standalone
cPanel package with `python tools/package_cpanel.py`. Upload
`dist/htxlamhong-public-html.zip` into the domain Document Root and extract it
there; the archive contains the HTML files and assets directly at its root.

## Local setup

1. Install Java 17, Maven 3.9+, and MySQL 8.
2. Copy `.env.example` to `.env` and replace all placeholder secrets.
3. Export the variables from `.env` in your shell.
4. On Windows, run `powershell -ExecutionPolicy Bypass -File .\run.ps1`. On other platforms, run `./mvnw spring-boot:run`.
5. Open <http://localhost:8081>.

Set `SEED_DATA=true` only when an empty development database should receive sample content. Production must use a unique `JWT_SECRET`, restricted `CORS_ALLOWED_ORIGINS`, and a non-default database account.

For a fresh database, set `ADMIN_INITIAL_PASSWORD` once to create the first administrator. Remove the variable after the account has been created; startup never resets an existing password.

## Verification

```shell
./mvnw clean test
./mvnw clean package
```

The generated build output is written to `target/` and runtime logs to `logs/`; neither belongs in version control.
