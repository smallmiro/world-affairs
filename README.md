# World Affairs Dashboard

국제 정세 모니터링 대시보드 (SIGINT). Next.js + Prisma + SQLite 기반.

## 기술 스택

- **Frontend + Backend**: Next.js 16 (App Router) + TypeScript
- **ORM / DB**: Prisma 7 + SQLite (@prisma/adapter-libsql)
- **배치 스케줄러**: node-cron + setInterval (별도 프로세스)
- **프로세스 관리**: pm2
- **UI**: Tailwind CSS v4 + inline CSS (Tokyo Night Storm/Day 테마) + react-leaflet + Recharts + react-markdown
- **i18n**: 커스텀 useT() 훅 + ko.json/en.json/ja.json
- **데이터 수집**: GDELT, RSS, OpenSky (OAuth2 Client Credentials), AviationStack, AISStream (WebSocket), Yahoo Finance (yahoo-finance2), DXB HTML 스크래핑 (cheerio)
- **AI**: Gemini API (번역 EN/KO/JA + 요약/감성/분석/브리핑)
- **실시간 통신**: SSE (Server-Sent Events) + in-memory PubSub
- **테스트**: Vitest

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

# AI (필수)
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash-lite     # Optional, 기본값

# 항공 모니터 (필수)
AVIATIONSTACK_API_KEY=your_key
OPENSKY_USERNAME=your_client_id         # OAuth2 Client ID
OPENSKY_PASSWORD=your_client_secret     # OAuth2 Client Secret

# 선박 추적 (필수)
AISSTREAM_API_KEY=your_key

# 내부 SSE 통신 (Optional)
SSE_PUBLISH_URL=http://localhost:3000/api/sse/publish
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
| **TopBar** | 실시간 시계, 언어 전환 (KR/EN/JA), 긴급 알림 카운트, 햄버거 메뉴 (모바일) | News + GeoEvents |
| **Alert Ticker** | 긴급 뉴스/이벤트 스크롤 배너 | critical/high severity 필터 |
| **Market Ticker** | 주요 지수/원자재/환율 한 줄 표시 (호버 시 인트라데이 차트) | Yahoo Finance |
| **World Map** | 지정학 이벤트 핫스팟 지도 (분쟁 필터) | GDELT GeoEvents |
| **News Feed** | 카테고리/지역 필터 뉴스 목록 + 기사 상세 모달 | GDELT + RSS |
| **Issue Tracker** | 지역별 이슈 심각도 카드 (정렬) | GeoEvents 집계 |
| **Vessel Tracking** | 중동 해역 선박 추적 지도 (유형 필터) + 해상 이벤트 모달 | AISStream WebSocket |
| **Airport Monitor** | DXB 공항 상태/항공기/AI 타임라인/항공사 그리드/EK 노선/DXB 출도착 현황 | OpenSky + AviationStack + dubaiairports.ae + Gemini |
| **Market Section** | 주식 지수 카드 + 원자재/환율 테이블 | Yahoo Finance |
| **AI Analysis** | 지역 감성 분석 + AI 브리핑 (마크다운 렌더링, 풀스크린 모달) | Goldstein scale + Gemini |

### 조작법

- **언어 전환**: TopBar 우측 `KR` 버튼 클릭 → KR → EN → JA 순환
- **다크/라이트 토글**: TopBar 테마 전환 버튼 (Tokyo Night Storm / Tokyo Night Day)
- **네비게이션**: TopBar 탭 (OVERVIEW, MAP, VESSELS, MARKETS, ANALYSIS, BRIEFING) 클릭 → 해당 섹션 스크롤
- **모바일 네비게이션**: 햄버거 메뉴 (≡) → 탭 목록 드롭다운
- **뉴스 필터**: 카테고리(외교/군사/경제/인권/환경) + 지역(동아시아/중동/유럽/북미) 필터
- **기사 상세**: 뉴스 항목 클릭 → 기사 상세 모달 표시
- **지도 필터**: 긴장도(전체) / 분쟁(conflict+military) 토글 + 긴장 구역 오버레이
- **선박 필터**: 전체 / 유조선 / LPG|LNG 필터 + 해상 경보 표시
- **이슈 정렬**: 심각도순 / 최신순 토글
- **AI 브리핑**: 전체화면 보기 버튼 → 풀스크린 모달 (ESC로 닫기)

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
| `collect-news` | 15분마다 (`*/15`) | GDELT + RSS | O |
| `collect-market` | 15분마다 (`*/15`) | Yahoo Finance | O |
| `collect-geo` | 30분마다 (`7,37`) | GDELT Events | O |
| `airport:flights` | 07-23시 5분 간격 (bbox/icao24 교대), 그 외 2시간 | OpenSky (OAuth2) | O |
| `airport:ops` | 하루 2회 (06:00, 18:00) | AviationStack | O |
| `airport:events` | 4시간마다 (`0 */4`) | GDELT | O |
| `airport:timeline` | 4시간마다 (`30 */4`, GDELT 30분 후) | Gemini API | O |
| `airport:dxb-flights` | 10분마다 (`*/10`) | dubaiairports.ae (HTML 스크래핑) | O |
| `airport:cleanup` | 매일 03:00 | - (7일 보존) | X |
| `ai:analysis` | 4시간마다 (`:10`) | Gemini API | X |
| `ai:briefing` | 매일 06:00 | Gemini API | O |
| `cleanup:global` | 매일 03:30 | - (30일 보존) | X |
| `ais:stream` | **상시 WebSocket** | AISStream.io | O (자동 재연결) |

> **참고:** 시작 시 실행(O) 잡은 3~5초 간격으로 staggered 실행됩니다.

### 번역

| Job | 주기 | 대상 |
|-----|------|------|
| `translate:news` | 15분마다 (`5,20,35,50`) | Article title/summary → ko/ja |
| `translate:geo` | 30분마다 (`5,35`) | GeoEvent title/desc → ko/ja |

## API 엔드포인트

### REST API

| Endpoint | Method | 파라미터 |
|----------|--------|---------|
| `/api/news` | GET | `lang`, `limit`, `region`, `category` |
| `/api/markets` | GET | `lang`, `type` |
| `/api/geo-events` | GET | `lang`, `limit`, `severity`, `eventType` |
| `/api/vessels` | GET | `lang` |
| `/api/airport` | GET | `section` (status\|flights\|events\|airlines\|routes\|dxb), `limit` |
| `/api/airport/flights` | GET | `limit` |
| `/api/airport/dxb-stats` | GET | DXB 스크래핑 통계 |
| `/api/airport/opensky-flights` | GET | OpenSky 항공편 위치 |
| `/api/airport/assessment` | GET | 공항 리스크 평가 |
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
│  │ Airport (Aviation) │  │  │ /api/airport/*             │ │
│  │ Airport (DXB HTML) │  │  │ /api/analysis/briefing     │ │
│  │ Timeline (Gemini)  │  │  │ /api/sse/positions (SSE)   │ │
│  │ Translate (Gemini) │  │  │ /api/sse/publish (내부)    │ │
│  │ AI Analysis        │  │  └─────────────┬───────────────┘ │
│  └────────────────────┘  │                │ pub/sub         │
│                          │                │                 │
│  ┌─ WebSocket ────────┐  │                │                 │
│  │ AIS (상시 연결)     │──┼── HTTP POST ──→│                 │
│  └────────────────────┘  │                ↓                 │
│           │              │          SSE 클라이언트           │
│           ↓              │                                  │
│    ┌─ SQLite DB ─────────┼──────────────────────────────┐   │
│    │ db/data.sqlite      │  (14 모델, Prisma ORM)       │   │
│    └─────────────────────┼──────────────────────────────┘   │
└──────────────────────────┴──────────────────────────────────┘
```

## 테스트

```bash
npm run test        # vitest 실행
npm run test:watch  # vitest 워치 모드
npx tsc --noEmit    # 타입 체크
```

## 프로젝트 구조

```
app/                        # Next.js App Router
  api/                      # REST + SSE API (12 엔드포인트)
  components/               # React 컴포넌트 (24개)
    layout/                 # TopBar, AlertTicker, MarketTickerBar, AlertPanel
    map/                    # WorldMap, WorldMapInner
    news/                   # NewsFeed, ArticleDetailModal
    issues/                 # IssueTracker
    vessels/                # VesselTracking, VesselMapInner, MaritimeEventModal
    airport/                # AirportMonitor, AirportMapInner, AirportTimeline,
                            # AirlineGrid, FlightStatusPanel, EKRouteBadges
    markets/                # MarketSection
    analysis/               # AiAnalysis, TrendChart
    ui/                     # SectionHeader, StatusLight, IntraDayChart
  hooks/                    # React Query 훅 (10개)
  i18n/                     # 다국어 번역 (ko.json, en.json, ja.json)
  lib/                      # API 클라이언트, 타입, 유틸
src/                        # 헥사고날 아키텍처
  domain/                   # 엔티티 + 포트 (6 바운디드 컨텍스트)
    news/, market/, vessel/, geopolitics/, airport/, analysis/
  adapters/                 # 포트 구현체
    collectors/             # 데이터 수집 (GDELT, RSS, OpenSky, AviationStack, AIS, DXB HTML)
    repositories/           # Prisma DB 어댑터 (6개)
    ai/                     # Gemini 번역 + 분석
  usecases/                 # 도메인 오케스트레이션 (12개)
  infrastructure/           # prisma, pubsub, publish-sse
  batch/                    # 스케줄러 (node-cron + WebSocket)
  shared/                   # 공통 타입, 분류 유틸
__tests__/                  # Vitest 테스트 (15개)
prisma/                     # DB 스키마 + 마이그레이션 (4개)
db/                         # SQLite DB 파일
scripts/                    # 운영 스크립트 (commit-data.sh)
docs/                       # PRD, 프로토타입
```
