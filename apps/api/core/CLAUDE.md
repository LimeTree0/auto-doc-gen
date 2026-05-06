# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is the `apps/api/core` workspace inside the `auto-doc-gen` monorepo (root: `../../../`). The repo is multi-app — `apps/api/core` is the Spring Boot backend, and `apps/web` is an independent React/Vite frontend with its own `CLAUDE.md`. There is no root build orchestration; each app is operated from its own directory.

The Gradle root for this app is `apps/api/core` itself (`settings.gradle` declares `rootProject.name = 'core'`), so all Gradle commands run from here.

## Commands

Run from `apps/api/core/`. On Windows use `gradlew.bat`; on POSIX use `./gradlew`.

- `./gradlew bootRun` — start the Spring Boot app (default port 8080). On startup it serves Swagger UI at `/swagger-ui.html` and the OpenAPI doc at `/api-docs`.
- `./gradlew build` — compile, run tests, and produce the boot jar.
- `./gradlew test` — run JUnit 5 tests.
- `./gradlew test --tests com.limecoding.core.CoreApplicationTests.contextLoads` — run a single test method (use the fully-qualified class plus method).

## Architecture

**Layered packaging per feature.** Each feature lives under `com.limecoding.core.<feature>` and is split into four layers — keep this split when adding code:

- `domain/` — JPA entities and pure domain types (e.g. `source/domain/Source.java`).
- `application/` — `@Service` orchestration that coordinates repositories and external I/O (e.g. `source/application/SourceService.java`).
- `infrastructure/` — Spring Data repositories and any other adapters (e.g. `source/infrastructure/SourceJpaRepository.java`).
- `presentation/` — `@RestController` endpoints, plus `presentation/dto/` for request/response shapes (e.g. `source/presentation/SourceController.java`).

Controllers depend on services; services depend on repositories. Do not skip layers (controllers must not touch repositories directly), and do not let `domain` types depend on Spring or persistence-adapter classes beyond JPA annotations.

**Standard response envelope.** All controller methods return `com.limecoding.core.common.ApiResponse<T>` via its static factories — `ApiResponse.success(...)` / `ApiResponse.error(...)`. Match this shape on new endpoints so the `apps/web` client can rely on a consistent `{ status, data, error }` payload.

**File uploads.** `SourceService.uploadSources` writes uploaded multipart files to a relative `uploads/` directory under the process's working directory and persists a `Source` row referencing the original filename. The `uploads/` folder is gitignored — assume it does not exist on a fresh checkout; the service creates it on first write.

**Persistence.** Both `com.h2database:h2` and `org.postgresql:postgresql` are on the runtime classpath. `application.yaml` does not configure a datasource yet, so Spring Boot auto-configures the in-memory H2 by default. When wiring a real PostgreSQL config, prefer adding it under a profile rather than removing H2 (H2 is what the contextLoads test relies on).

**Lombok is the default for boilerplate.** Entities, DTOs, services, and controllers use `@Getter`, `@RequiredArgsConstructor`, `@NoArgsConstructor`, `@Slf4j`, etc. Make sure new modules wire `org.projectlombok:lombok` as both `compileOnly` and `annotationProcessor` (already configured in `build.gradle`) — IDEs without the Lombok plugin will show false-positive "cannot resolve" errors.

## Stack notes

- Java 21 toolchain (declared in `build.gradle`); Gradle will download the JDK if missing.
- Spring Boot 4.0.6 with `spring-boot-starter-webmvc` (servlet stack, not WebFlux) and `spring-boot-starter-data-jpa`.
- SpringDoc OpenAPI 3.0.3 — when adding endpoints, prefer Springdoc/`@Operation` annotations over hand-rolled docs so `/swagger-ui.html` stays accurate.
