# CLAUDE.md — World Affairs Dashboard

## 프로젝트 개요

국제 정세 모니터링 대시보드 (SIGINT). Next.js + Prisma + SQLite 기반.

- PRD: `docs/prd.md`
- UI 프로토타입: `docs/index.html`

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 + 백엔드 | Next.js (App Router) + TypeScript |
| API | Next.js API Routes (`app/api/`) |
| ORM | Prisma (SQLite) |
| DB | SQLite (`db/data.sqlite`) |
| 배치 스케줄러 | node-cron (별도 프로세스) |
| 프로세스 관리 | pm2 |
| UI | MUI v5 + Tailwind CSS |
| 지도 | react-leaflet + Leaflet.js |
| 차트 | Recharts |
| 스크래핑 | Playwright |
| AI/번역 | Gemini API (번역 EN/KO/JA + 요약/감성/브리핑) |

## 프로젝트 구조

```
/
├── app/                        # Next.js App Router (프론트 + API Routes)
│   └── api/                    # API 엔드포인트
├── src/                        # 헥사고날 아키텍처 소스
│   ├── domain/                 # 도메인 엔티티 + 포트 (순수 비즈니스, 외부 의존성 없음)
│   ├── adapters/               # 포트 구현체 (외부 의존성)
│   │   ├── collectors/         # 데이터 수집 어댑터
│   │   ├── repositories/       # Prisma DB 어댑터
│   │   └── ai/                 # Gemini API 어댑터
│   ├── usecases/               # 유스케이스 (도메인 오케스트레이션)
│   ├── infrastructure/         # 프레임워크 설정 (prisma.ts, gemini.ts)
│   ├── batch/                  # 배치 스케줄러 (node-cron)
│   └── shared/                 # 공통 타입, 유틸
├── prisma/
│   └── schema.prisma           # DB 스키마
├── db/
│   └── data.sqlite             # SQLite DB 파일
└── docs/                       # PRD, 프로토타입
```

## 실행 방식

- Next.js 서버 + 배치 스케줄러를 **pm2**로 함께 관리
- 배포: 로컬 머신 또는 VPS (SQLite 파일 기반, 서버리스 불가)

---

# 개발 원칙

Kent Beck의 TDD & Tidy First 방법론을 따른다.

## TDD (Test-Driven Development)

**Red → Green → Refactor** 사이클을 엄격히 따른다.

1. **Red**: 실패하는 테스트를 먼저 작성한다. 작고 명확한 단위로.
2. **Green**: 테스트를 통과시키는 **최소한의 코드**만 작성한다. 그 이상은 쓰지 않는다.
3. **Refactor**: 테스트가 통과한 상태에서만 리팩토링한다.

### TDD 규칙

- 한 번에 하나의 테스트만 작성하고, 통과시키고, 구조를 개선한다
- 테스트 이름은 행위를 설명한다 (예: `shouldReturnLatestNewsByRegion`)
- 테스트 실패 메시지는 명확하고 정보를 담아야 한다
- 결함 수정 시: 먼저 API 레벨 실패 테스트를 작성 → 가장 작은 재현 테스트 작성 → 둘 다 통과시킨다
- 매 변경 후 전체 테스트를 실행한다 (장시간 테스트 제외)

## Tidy First (구조 변경 우선)

모든 변경을 두 가지로 엄격히 분리한다:

1. **구조적 변경 (Structural)**: 동작을 바꾸지 않고 코드를 정리 (이름 변경, 메서드 추출, 코드 이동)
2. **동작적 변경 (Behavioral)**: 실제 기능을 추가하거나 수정

### 규칙

- 구조적 변경과 동작적 변경을 **같은 커밋에 섞지 않는다**
- 두 가지 모두 필요할 때는 **구조적 변경을 먼저** 한다
- 구조적 변경 전후로 테스트를 실행하여 동작이 변하지 않았음을 확인한다

## 커밋 규율

커밋은 다음 조건이 **모두** 충족될 때만 한다:

1. 모든 테스트가 통과한다
2. 컴파일러/린터 경고가 없다
3. 하나의 논리적 작업 단위를 나타낸다
4. 커밋 메시지에 구조적 변경인지 동작적 변경인지 명시한다

작고 빈번한 커밋을 선호한다.

## 도구 활용

### LSP (Language Server Protocol)

코드베이스 분석, 코드 작성, 검색 시 **LSP를 적극 활용**한다:

- 심볼 검색 (`workspace/symbol`): 클래스, 함수, 타입 정의 위치 찾기
- 정의로 이동 (`textDocument/definition`): 참조에서 원본 정의로 추적
- 참조 찾기 (`textDocument/references`): 특정 심볼이 사용되는 모든 위치 탐색
- 타입 정보 (`textDocument/hover`): 변수/함수의 타입 확인
- 진단 (`textDocument/diagnostic`): 타입 에러, 린트 경고 확인

Grep/Glob 등 텍스트 기반 검색보다 LSP를 우선 사용한다. LSP는 언어의 의미를 이해하므로 더 정확한 결과를 제공한다.

## 코드 품질 기준

- 중복을 철저히 제거한다
- 이름과 구조로 의도를 명확히 표현한다
- 의존성을 명시적으로 만든다
- 메서드는 작게, 단일 책임으로 유지한다
- 상태와 부수 효과를 최소화한다
- 가능한 가장 단순한 해결책을 사용한다

## 아키텍처 원칙

### 헥사고날 아키텍처 (Ports & Adapters)

- **도메인 계층**: 비즈니스 로직은 외부 의존성(DB, API, 프레임워크)을 직접 참조하지 않는다
- **포트 (Port)**: 도메인이 외부와 소통하는 인터페이스 (TypeScript interface/type)
- **어댑터 (Adapter)**: 포트의 구현체. DB 접근, 외부 API 호출 등은 어댑터에서 처리
- 의존성 방향: 외부 → 도메인 (도메인은 외부를 모른다)

### 클린 아키텍처

- **계층 분리**: 엔티티 → 유스케이스 → 어댑터 → 프레임워크
- 안쪽 계층은 바깥쪽 계층을 알지 못한다
- 유스케이스는 프레임워크(Next.js, Prisma)에 의존하지 않는다

### DDD (Domain-Driven Design)

- 도메인 모델을 중심으로 설계한다
- 유비쿼터스 언어: 코드의 네이밍은 도메인 용어를 그대로 사용한다
- 바운디드 컨텍스트: 뉴스, 시장, 선박, 이슈, 분석 — 각 도메인은 독립적으로 모델링한다

---

# 워크플로우

## 브랜치 전략: Git-Flow

```
main          ← 프로덕션 릴리스 (태그)
└── develop   ← 통합 개발 브랜치
    ├── feature/issue-{번호}-{설명}   ← 기능 개발
    ├── fix/issue-{번호}-{설명}       ← 버그 수정
    ├── tidy/issue-{번호}-{설명}      ← 구조적 변경 (Tidy First)
    └── release/v{버전}               ← 릴리스 준비
```

### 브랜치 규칙

- 모든 작업은 `develop`에서 분기한다
- `main`에 직접 커밋하지 않는다
- 브랜치 이름에 이슈 번호를 포함한다
- Tidy First 구조적 변경은 `tidy/` 접두사를 사용한다
- 기능 완료 후 PR을 생성하여 `develop`에 병합한다
- 릴리스 시 `release/` 브랜치를 생성하고 `main`과 `develop` 양쪽에 병합한다

## GitHub 이슈 기반 작업 관리

**모든 작업은 반드시 GitHub 이슈를 먼저 생성한 후 시작한다.**

### 이슈 생성 원칙 (Tidy First)

이슈도 Tidy First 원칙에 따라 구조적 변경과 동작적 변경을 분리한다:

| 이슈 유형 | 라벨 | 브랜치 접두사 | 설명 |
|-----------|------|---------------|------|
| 구조적 변경 | `tidy` | `tidy/` | 리팩토링, 이름 변경, 모듈 분리 등 동작을 바꾸지 않는 변경 |
| 기능 개발 | `feature` | `feature/` | 새로운 동작을 추가하는 변경 |
| 버그 수정 | `fix` | `fix/` | 기존 동작의 결함을 수정하는 변경 |
| 문서 | `docs` | `docs/` | 문서 추가/수정 |

### 이슈 작성 규칙

이슈에는 개발에 필요한 **심층 정보**를 포함한다:

```markdown
## 목적
왜 이 작업이 필요한가 (비즈니스/기술적 이유)

## PRD 참조
`docs/prd.md` 섹션 번호 및 관련 요구사항 (예: 4.1 뉴스 수집, 5.1 기술 스택)

## 담당 에이전트
이 작업을 수행할 전문 에이전트 명시 (예: feature-dev, code-architect 등)

## 상세 설계
- 영향받는 파일/모듈
- 도메인 모델 변경사항
- API 엔드포인트 설계
- DB 스키마 변경사항
- 외부 의존성 및 데이터 소스 (docs/prd.md 부록 A 참조)

## Tidy First 선행 작업
이 이슈를 수행하기 전에 필요한 구조적 변경 이슈 목록 (있는 경우)

## 테스트 계획
- 작성할 테스트 시나리오
- Red → Green → Refactor 순서

## 완료 조건
- [ ] 모든 테스트 통과
- [ ] 린터/타입 체크 통과
- [ ] PR 생성 및 코드 리뷰 완료
```

### 이슈 참조 규칙

- 모든 이슈는 **`docs/prd.md`를 참조**한다. PRD의 어떤 요구사항(섹션 번호)과 관련되는지 명시한다.
- 데이터 소스 관련 이슈는 PRD **부록 A**의 상세 정보를 참조한다.
- 이슈에 해당 작업을 수행할 **전문 에이전트**를 명시한다.

### 전문 에이전트 목록

| 에이전트 | 용도 | 사용 시점 |
|----------|------|-----------|
| `feature-dev` | 기능 개발 | 새 기능 구현, 유스케이스 작성 |
| `code-architect` | 아키텍처 설계 | 모듈 설계, 의존성 구조, 인터페이스 정의 |
| `code-explorer` | 코드 분석 | 기존 코드 파악, 실행 경로 추적 |
| `code-reviewer` | 코드 리뷰 | PR 리뷰, 품질 검증 |
| `code-simplifier` | 코드 단순화 | 복잡한 코드 정리, Tidy First 구조적 변경 |
| `silent-failure-hunter` | 에러 핸들링 검증 | catch 블록, 폴백 로직 점검 |
| `pr-test-analyzer` | 테스트 커버리지 | PR의 테스트 충분성 분석 |
| `type-design-analyzer` | 타입 설계 분석 | 새 타입 도입 시 캡슐화, 불변식 검증 |

## 전체 워크플로우

```
1. GitHub 이슈 생성
   ├── Tidy First 분류 (구조적 vs 동작적)
   ├── PRD 참조 섹션 명시 (docs/prd.md)
   ├── 담당 전문 에이전트 명시
   └── 심층 설계 정보 작성

2. 브랜치 생성
   └── git checkout -b {type}/issue-{번호}-{설명} develop

3. 구조적 변경이 필요한 경우 (Tidy First)
   ├── 별도 tidy/ 이슈 & 브랜치로 선행 처리
   ├── 테스트 실행 → 동작 변화 없음 확인
   └── PR → develop 병합

4. 기능 개발 (TDD)
   ├── Red: 실패 테스트 작성
   ├── Green: 최소 코드로 통과
   ├── Refactor: 구조 개선 (테스트 통과 상태에서만)
   └── 반복

5. PR 생성
   ├── code-reviewer 에이전트로 리뷰
   ├── pr-test-analyzer로 테스트 커버리지 확인
   └── develop에 병합

6. 릴리스
   ├── release/ 브랜치 생성
   ├── main + develop 양쪽 병합
   └── 태그 생성
```
