# World Affairs Dashboard

국제 정세 모니터링 대시보드 (SIGINT). Next.js + Prisma + SQLite 기반.

## 기술 스택

- **Frontend + Backend**: Next.js (App Router) + TypeScript
- **ORM / DB**: Prisma + SQLite
- **배치 스케줄러**: node-cron + setInterval (별도 프로세스)
- **프로세스 관리**: pm2
- **UI**: MUI v5 + Tailwind CSS + react-leaflet + Recharts
- **데이터 수집**: GDELT, RSS, OpenSky (OAuth2), AviationStack, AISStream (WebSocket), Yahoo Finance
- **AI/번역**: Gemini API (번역 EN/KO/JA + 요약/감성/브리핑)
- **실시간 통신**: SSE (Server-Sent Events) + in-memory pub/sub

## 설치

```bash
git clone https://github.com/smallmiro/world-affairs.git
cd world-affairs
npm install
cp .env.example .env   # API 키 설정
npx prisma generate
```

## 환경 변수 (.env)

```
DATABASE_URL="file:../db/data.sqlite"

# AI/번역 (필수)
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash-lite     # Optional, 기본값

# 항공 모니터 (필수)
AVIATIONSTACK_API_KEY=your_key
OPENSKY_USERNAME=your_client_id         # OAuth2 Client ID
OPENSKY_PASSWORD=your_client_secret     # OAuth2 Client Secret

# 선박 추적 (필수)
AISSTREAM_API_KEY=your_key

# 내부 SSE 통신 (Optional)
INTERNAL_API_KEY=world-affairs-internal
```

## 빠른 시작 (화면 확인)

```bash
# 1. 의존성 설치 + Prisma 클라이언트 생성
npm install && npx prisma generate

# 2. 개발 모드로 바로 실행
npm run dev
```

브라우저에서 **http://localhost:3000** 접속하면 대시보드를 볼 수 있습니다.

> `db/data.sqlite`에 초기 데이터가 포함되어 있어 별도 데이터 수집 없이 바로 확인 가능합니다.

### 대시보드 섹션

| 섹션 | 설명 | 데이터 소스 |
|------|------|------------|
| **TopBar** | 실시간 시계, 언어 전환 (KO/EN/JA), 긴급 알림 카운트 | News + GeoEvents |
| **Alert Ticker** | 긴급 뉴스/이벤트 스크롤 배너 | critical/high severity 필터 |
| **Market Ticker** | 주요 지수/원자재/환율 한 줄 표시 | Yahoo Finance |
| **World Map** | 지정학 이벤트 핫스팟 지도 (분쟁 필터) | GDELT GeoEvents |
| **News Feed** | 카테고리/지역 필터 뉴스 목록 | GDELT + RSS |
| **Issue Tracker** | 지역별 이슈 심각도 카드 (정렬) | GeoEvents 집계 |
| **Vessel Tracking** | 중동 해역 선박 추적 지도 (유형 필터) | AISStream WebSocket |
| **Airport Monitor** | DXB 공항 상태/항공기/이벤트/항공사/노선 | OpenSky + AviationStack |
| **Market Section** | 주식 지수 카드 + 원자재/환율 테이블 | Yahoo Finance |
| **AI Analysis** | 지역 감성 분석 + AI 브리핑 | Goldstein scale + Gemini |

### 조작법

- **언어 전환**: TopBar 우측 `KO` 버튼 클릭 → KO → EN → JA 순환
- **네비게이션**: TopBar 탭 (MAP, VESSELS, MARKETS, ANALYSIS) 클릭 → 해당 섹션 스크롤
- **뉴스 필터**: 카테고리(외교/군사/경제/인권/환경) + 지역(동아시아/중동/유럽/북미) 필터
- **지도 필터**: 긴장도(전체) / 분쟁(conflict+military) 토글
- **선박 필터**: 전체 / 유조선 / LPG|LNG 필터
- **이슈 정렬**: 심각도순 / 최신순 토글

## 개발 모드

```bash
npm run dev         # Next.js dev server (http://localhost:3000)
```

## 프로덕션 실행 (pm2)

### 1. 빌드

```bash
npm run build
```

### 2. pm2 시작

```bash
pm2 start ecosystem.config.js
```

2개 프로세스가 실행됩니다:

| 프로세스 | 역할 | 포트 |
|----------|------|------|
| `world-affairs-web` | Next.js 웹 서버 | :3000 |
| `world-affairs-batch` | 배치 스케줄러 + AIS WebSocket | - |

### 3. 상태/로그 확인

```bash
pm2 status                         # 프로세스 상태
pm2 logs                           # 전체 실시간 로그
pm2 logs world-affairs-batch       # 배치 로그만
```

### 4. 운영 명령어

```bash
pm2 restart all                    # 전체 재시작
pm2 restart world-affairs-batch --update-env  # .env 변경 시
pm2 stop all                       # 전체 중지
pm2 delete all                     # 전체 삭제
pm2 save                           # 현재 상태 저장 (재부팅 후 자동 복구)
pm2 startup                        # 시스템 부팅 시 자동 시작 등록
```

## 배치 스케줄

### 데이터 수집

| Job | 주기 | 데이터 소스 | 시작 시 실행 |
|-----|------|------------|------------|
| `collect-news` | 15분마다 | GDELT + RSS | O |
| `collect-market` | 15분마다 | Yahoo Finance | O |
| `collect-geo` | 30분마다 | GDELT Events | O |
| `airport:flights` | 07-23시 2분, 그 외 1시간 | OpenSky (OAuth2) | O |
| `airport:ops` | 하루 2회 (06:00, 18:00) | AviationStack | O |
| `airport:events` | 4시간마다 | GDELT Airport | O |
| `airport:cleanup` | 매일 03:00 | - (7일 보존) | X |
| `ais:stream` | **상시 WebSocket** | AISStream.io | O (자동 재연결) |

### 번역

| Job | 주기 | 대상 |
|-----|------|------|
| `translate:news` | 15분마다 (수집 5분 후) | Article title/summary → ko/ja |
| `translate:geo` | 30분마다 (수집 5분 후) | GeoEvent title/desc → ko/ja |
| `translate:airport` | 4시간마다 (수집 5분 후) | AirportEvent title → ko/ja |

## API 엔드포인트

### REST API

| Endpoint | Method | 파라미터 |
|----------|--------|---------|
| `/api/news` | GET | `lang`, `limit`, `region`, `category` |
| `/api/markets` | GET | `type` |
| `/api/geo-events` | GET | `lang`, `limit`, `severity`, `eventType` |
| `/api/vessels` | GET | `type`, `zone` |
| `/api/airport` | GET | `section` (status\|flights\|events\|airlines\|routes), `limit` |
| `/api/analysis/briefing` | GET | `lang` |

### SSE (Server-Sent Events)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/sse/positions` | GET | 실시간 선박/항공기 위치 스트리밍 |
| `/api/sse/publish` | POST | 내부 pub/sub 발행 (배치→웹, `x-internal-key` 인증) |

#### SSE 클라이언트 사용법

```typescript
const es = new EventSource("/api/sse/positions");

es.addEventListener("vessels", (e) => {
  const vessels = JSON.parse(e.data);
  // [{ mmsi, name, type, lat, lon, speed, course, timestamp }]
});

es.addEventListener("flights", (e) => {
  const flights = JSON.parse(e.data);
  // [{ icao24, callsign, lat, lon, altitude, speed, heading, aircraftClass }]
});
```

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     pm2 프로세스 관리                         │
├──────────────────────────┬──────────────────────────────────┤
│  world-affairs-batch     │  world-affairs-web               │
│                          │                                  │
│  ┌─ node-cron ────────┐  │  ┌─ Next.js App Router ───────┐ │
│  │ News (GDELT+RSS)   │  │  │ /api/news                  │ │
│  │ Market (Yahoo)     │  │  │ /api/markets               │ │
│  │ Geo (GDELT)        │  │  │ /api/geo-events            │ │
│  │ Airport (OpenSky)  │  │  │ /api/vessels               │ │
│  │ Airport (Aviation) │  │  │ /api/airport               │ │
│  │ Translate (Gemini) │  │  │ /api/sse/positions (SSE)   │ │
│  └────────────────────┘  │  │ /api/sse/publish (내부)    │ │
│                          │  └─────────────┬───────────────┘ │
│  ┌─ WebSocket ────────┐  │                │ pub/sub         │
│  │ AIS (상시 연결)     │──┼── HTTP POST ──→│                 │
│  └────────────────────┘  │                ↓                 │
│           │              │          SSE 클라이언트           │
│           ↓              │                                  │
│    ┌─ SQLite DB ─────────┼──────────────────────────────┐   │
│    │ db/data.sqlite      │                              │   │
│    └─────────────────────┼──────────────────────────────┘   │
└──────────────────────────┴──────────────────────────────────┘
```

## 테스트

```bash
npm run test        # vitest 실행
npx tsc --noEmit    # 타입 체크
```

## 프로젝트 구조

```
app/                        # Next.js App Router
  api/                      # REST + SSE API
  components/               # React 컴포넌트
  hooks/                    # React Query 훅
  lib/                      # API 클라이언트, 타입
src/
  domain/                   # 엔티티 + 포트 (순수 비즈니스)
    news/, market/, vessel/, geopolitics/, airport/, analysis/
  adapters/                 # 포트 구현체
    collectors/             # 데이터 수집 (GDELT, RSS, OpenSky, AviationStack, AIS)
    repositories/           # Prisma DB 어댑터
    ai/                     # Gemini 번역기
  usecases/                 # 도메인 오케스트레이션
  infrastructure/           # prisma, gemini, pubsub, publish-sse
  batch/                    # 스케줄러 (node-cron + WebSocket)
  shared/                   # 공통 타입, 분류 유틸
prisma/                     # DB 스키마 + 마이그레이션
db/                         # SQLite DB 파일
docs/                       # PRD, 프로토타입
```
