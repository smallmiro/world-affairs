# PRD: 국제 정세 모니터링 대시보드 (World Affairs Dashboard)

## 참고 자료

- [UI 프로토타입 (index.html)](./index.html)

## 1. 개요

전 세계 국제 정세와 지정학적 이슈를 실시간으로 모니터링하고 분석할 수 있는 웹 기반 대시보드를 구축한다.

## 2. 목표

- 국제 관계(International Relations) 및 지정학(Geopolitics) 관련 뉴스와 이벤트를 한눈에 파악
- 주요 국가/지역별 정세 변화를 시각적으로 추적
- 국제 이슈의 트렌드와 심각도를 분석하여 의사결정 지원

## 3. 대상 사용자

- 국제 정세에 관심 있는 개인 사용자
- 리서치 및 분석 업무 종사자
- 투자/비즈니스 의사결정에 지정학적 리스크를 고려하는 사용자

## 4. 핵심 요구사항

### 4.1 뉴스 수집 및 표시

- 다양한 소스(뉴스 API, RSS 등)에서 국제 정세 관련 뉴스를 수집
- 카테고리별 분류: 외교, 군사/안보, 경제/무역, 인권, 환경, 기술 경쟁
- 지역별 필터링: 동아시아, 중동, 유럽, 북미, 남미, 아프리카 등
- 주요 뉴스 하이라이트 및 타임라인 표시

### 4.2 국가/지역 관계 시각화

- 세계 지도 기반 인터랙티브 뷰
- 국가 간 관계(동맹, 갈등, 무역 등)를 시각적으로 표현
- 지역별 긴장도/리스크 수준 히트맵
- 주요 분쟁 지역 및 핫스팟 표시

### 4.3 이슈 분석

- 주요 국제 이슈별 요약 및 타임라인 추적
- 이슈 심각도(severity) 레벨 표시
- 관련 국가 및 이해관계자 매핑
- 트렌드 분석: 이슈 빈도, 관심도 변화 추이

### 4.4 알림 및 모니터링

- 주요 이벤트 발생 시 알림 (긴급 속보, 심각도 변화 등)
- 사용자 관심 지역/이슈 커스텀 워치리스트
- 일간/주간 브리핑 요약 제공

### 4.5 AI 기반 분석

- 뉴스 기사 자동 요약
- 감성 분석(Sentiment Analysis)을 통한 정세 분위기 파악
- 관련 이슈 자동 클러스터링
- 향후 전망 및 시나리오 분석 지원

### 4.6 해상 선박 추적 (중동 에너지 항로)

- AIS(선박자동식별장치) 데이터를 활용한 유조선(Tanker) 및 LPG선 실시간 위치 추적
- 주요 모니터링 해역: 호르무즈 해협, 바브엘만데브 해협, 수에즈 운하, 페르시아만, 홍해, 아덴만
- 지도 위 선박 위치 및 항로 시각화
- 선박 유형별 필터링: 유조선(Crude/Product Tanker), LPG/LNG선
- 선박 상세 정보 표시: 선명, 선적국, 톤수, 출발지/목적지, 속도
- 항로 이상 감지: 우회 항로, 비정상 정박, 항로 이탈 등 이상 패턴 알림
- 해역별 통과 선박 수 및 물동량 추이 통계
- 분쟁/긴장 고조 시 해상 교통 변화 분석 (봉쇄, 우회 증가 등)

### 4.7 금융 시장 모니터링

- 상단 시장 티커 바: 주요 지수/원자재/환율 한 줄 실시간 표시
- 티커 바 호버 시 확장되어 각 지표별 인트라데이 라인 차트 표시 (그리드, 시간 라벨, 현재가, 시가 기준선 포함)
- 마우스 아웃 시 부드럽게 축소
- 국내 주식: KOSPI, KOSDAQ 지수 및 등락률, 미니 차트
- 미국 주식: S&P 500, NASDAQ, DOW JONES 지수 및 등락률, 미니 차트
- 아시아 주식: NIKKEI 225 등 주요 아시아 시장 지수
- 에너지: WTI 원유, 브렌트유, 두바이유, 천연가스 가격 및 변동
- 귀금속: 금(Gold), 은(Silver), 구리(Copper) 현물 가격
- 환율: USD/KRW, EUR/USD, USD/JPY 등 주요 통화쌍
- 시장 심리: VIX(공포지수), 비트코인(BTC) 가격
- 지정학적 이벤트와 시장 반응 간 연관성 시각화

### 4.8 두바이 공항 모니터링 (Dubai Airport Monitor)

두바이 국제공항(DXB)의 운항 상황과 주변 지정학적 리스크를 실시간으로 모니터링한다. 중동 지역 분쟁이 항공 운항에 미치는 영향을 추적하는 것이 핵심 목적이다.

#### 4.8.1 공항 운영 상태

- DXB 공항의 실시간 운항 상태 표시: OPERATIONAL / DELAYS / CLOSED
- 활주로 상태: 활성 활주로 정보 (예: RWY 12L/30R · 12R/30L ACTIVE)
- 기상 정보: 시정(Visibility), 풍향/풍속 (예: VIS 10km+ · WIND 320°/12kt)
- 상태 표시등(초록/노랑/빨강)을 통한 직관적 운영 상태 확인

#### 4.8.2 항공기 위치 지도

- Leaflet 기반 두바이 공항 중심 항공 레이더 지도
- DXB 공항 접근/출발 구역 시각화 (60km, 150km 반경)
- 에미레이트항공(EK) 항공기와 기타 항공사 항공기 구분 색상 표시
- 주요 항로 표시: ICN, LHR, NRT, IKA, DOH, PEK 등 DXB 발착 노선
- 주변 분쟁구역/경계구역 오버레이: 예멘 후티 분쟁구역, 이란 군사훈련구역, 이라크/시리아 구역, 호르무즈 해협 위험구역
- 레이더 스윕(sweep) 애니메이션 효과
- 추적 항공기 수 및 EK/기타 항공사 구분 현황 표시

#### 4.8.3 7일 타임라인

- 최근 7일간 공항 관련 이벤트를 수직 타임라인으로 최신순 표시
- 이벤트 유형별 태그 분류:
  - **분쟁 (Conflict)**: STRIKE, ALERT — 군사 행동, 무력 공격, 훈련 등
  - **운항 (Operations)**: REROUTE, DELAY, NOTAM — 항로 우회, 지연, 항공고시보 등
  - **안전 (Safety)**: SAFE, OPS — 정상 운영, 항로 정상화 등
  - **정보 (Intelligence)**: INTEL, EK — 방공 경계, 항공사 운항 결정 등
- 당일(TODAY) 이벤트 강조 표시

#### 4.8.4 주요 항공사 운항 현황

- DXB 취항 주요 항공사의 24시간 운항 현황
- 표시 항목: 항공사명(IATA 코드), 운항 편수, 정시율(%)
- 운항 상태 표시등: 정상(초록), 지연(노랑), 결항/혼란(빨강)
- 모니터링 대상 항공사: 에미레이트(EK), 플라이두바이(FZ), 카타르항공(QR), 대한항공(KE), 루프트한자(LH), 이란항공(IR) 등

#### 4.8.5 에미레이트항공 노선 현황

- EK 주요 노선별 운항 상태를 뱃지 형태로 표시
- 노선 상태 분류:
  - **OPEN**: 정상 운항 (ICN, LHR, NRT, SIN, JFK, CDG, DME, BKK, SYD 등)
  - **DIVERTED**: 우회 운항 (IKA 등 분쟁 영향 노선)
  - **SUSPENDED**: 운항 중단 (TLV, BEY 등 분쟁 지역 노선)
- 각 뱃지에 목적지 공항 코드, 편명, 상태 표시

#### 4.8.6 데이터 수집

- 수집 주기: 1시간 간격
- 데이터 보관: 최근 7일간 이벤트 이력
- 수집 대상: 공항 운영 상태, 항공기 위치, NOTAM, 항공사 운항 정보, 주변 분쟁/군사 활동 정보

### 4.9 대시보드 UI

- 커스터마이징 가능한 위젯 기반 대시보드
- 다크/라이트 모드 지원
- 반응형 디자인 (데스크탑, 태블릿, 모바일)
- 다국어 지원: **한국어, 영어, 일본어** (3개 언어)
- 데이터 수집 시 원문 언어와 무관하게 3개 언어로 번역하여 저장 (Gemini API 활용)
- 사용자 언어 설정에 따라 해당 언어 데이터를 표시

## 5. 기술 스택

### 5.1 프론트엔드 + 백엔드 (통합)

| 구분 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | **Next.js** (App Router) + TypeScript | React 포함, 프론트/백엔드 통합 |
| API | **Next.js API Routes** (`app/api/`) | REST API 엔드포인트 |
| UI 라이브러리 | MUI (Material UI) v5 | 테이블, 카드, 탭, 다이얼로그 등 |
| 스타일링 | Tailwind CSS | 유틸리티 기반 커스텀 스타일링 |
| 지도 | react-leaflet + Leaflet.js | 세계 지도 및 선박 추적 지도 |
| 차트 | Recharts 또는 Apache ECharts | 트렌드, 미니 차트, 감성 분석 |
| 상태 관리 | Zustand 또는 React Query | 서버 상태 캐싱 및 클라이언트 상태 |
| 다국어 | react-i18next | 한국어/영어/일본어 |
| ORM | **Prisma** | 타입 안전 DB 접근, 마이그레이션 관리 |
| 스케줄러 | **node-cron** | 배치 데이터 수집 (별도 프로세스) |
| AI/LLM + 번역 | **Gemini API** (Google) | 뉴스 요약, 감성 분석, 브리핑 생성, 다국어 번역 (EN/KO/JA) |

### 5.3 데이터 수집

- 웹 스크래핑이 필요한 소스는 **Playwright**를 사용하여 수집
- API/RSS가 제공되는 소스는 해당 방식을 우선 사용
- 수집된 데이터는 원문 언어와 무관하게 **Gemini API**를 사용하여 한국어/영어/일본어 3개 언어로 번역 후 저장
- 번역은 배치 수집 파이프라인에서 수행 (수집 → 번역 → 저장)

| 데이터 | 소스 | 수집 방식 |
|--------|------|-----------|
| 뉴스 | GDELT, NewsAPI, GNews, RSS Feeds | REST API / RSS 폴링 (15분~1시간) |
| 뉴스 (스크래핑) | The Economist, CNN World, NBC News World, Reuters | Playwright 스크래핑 (1시간 주기) |
| 주식/지수 | Yahoo Finance (yfinance), Alpha Vantage, Twelve Data | REST API 폴링 (시장 개장 시 1분~15분) |
| 원자재/에너지 | Yahoo Finance (선물), Alpha Vantage | REST API 폴링 (15분~1시간) |
| 환율 | ExchangeRate-API, Alpha Vantage, Open Exchange Rates | REST API 폴링 (15분~1시간) |
| 선박 AIS | AISStream.io (WebSocket), Kpler (유료) | WebSocket 실시간 스트리밍 |
| 지정학 리스크 | GDELT, ACLED, Fragile States Index | REST API / 주기적 다운로드 |
| VIX/BTC | Yahoo Finance (^VIX, BTC-USD), CoinGecko | REST API 폴링 |
| 항공 데이터 | FlightRadar24, AviationStack, FAA NOTAM | REST API + Playwright 스크래핑 (1시간) |
| AI 분석 | Gemini API (Google) | REST API (Flash-Lite: 요약/감성, Flash: 브리핑/클러스터) |

상세 데이터 소스 목록은 [부록 A](#부록-a-데이터-소스-상세) 참조

### 5.4 데이터베이스

| 구분 | 기술 | 용도 |
|------|------|------|
| 주 DB | **SQLite** (단일 파일) | 뉴스, 이슈, 시장 데이터 이력, 사용자 설정 |
| ORM | **Prisma** | 스키마 정의, 마이그레이션, 타입 안전 쿼리 |
| DB 파일 | `db/data.sqlite` | 로컬 단일 파일, 별도 DB 서버 불필요 |

> **참고:** SQLite 파일 기반이므로 외부 DB 서버(PostgreSQL, Redis 등)가 불필요하여 운영 비용이 0원. 향후 트래픽 증가 시 PostgreSQL로 마이그레이션 가능 (Prisma provider 변경만으로 전환).

### 5.5 인프라 및 배포

| 구분 | 기술 | 비고 |
|------|------|------|
| 프로세스 관리 | **pm2** | Next.js 서버 + 배치 스케줄러 동시 관리 |
| 배포 환경 | 로컬 머신 또는 VPS | SQLite 파일 기반이므로 서버리스 환경 불가 |
| CI/CD | GitHub Actions | 자동 테스트 및 배포 |

## 6. 시스템 아키텍처

### 6.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 (브라우저)                      │
│  Next.js (React) + TypeScript + MUI + Tailwind CSS             │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┬───────────┐│
│  │ 세계지도  │ 뉴스피드  │ 이슈트래커│ 선박추적  │ 공항모니터 │ 시장데이터 ││
│  │(Leaflet) │          │          │(Leaflet) │ (Leaflet) │ (Recharts)││
│  └──────────┴──────────┴──────────┴──────────┴───────────┴───────────┘│
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API (Next.js API Routes)
┌──────────────────────▼──────────────────────────────────────────┐
│                   Next.js Server (App Router)                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ API Routes (app/api/)                                │      │
│  │ /api/news    /api/markets    /api/vessels            │      │
│  │ /api/issues  /api/analysis   /api/alerts             │      │
│  │ /api/airport                                        │      │
│  └──────────────────────┬───────────────────────────────┘      │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────┐      │
│  │              Prisma ORM                              │      │
│  │  타입 안전 쿼리 · 스키마 관리 · 마이그레이션            │      │
│  └──────────────────────┬───────────────────────────────┘      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │       SQLite (db/data.sqlite)   │
          │                                 │
          │  · 뉴스 이력    · 시장 이력      │
          │  · 이슈 데이터  · 선박 항로      │
          │  · 항공 데이터  · AI 분석 결과   │
          │  · 사용자 설정                  │
          └────────────────▲────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│              배치 스케줄러 (별도 프로세스, pm2 관리)               │
│  ┌───────────────┐  ┌────────────────┐                         │
│  │ Data Collector│  │ AI Processor   │                         │
│  │ (node-cron)   │  │ (Gemini API)   │                         │
│  │               │  │                │                         │
│  │ · 뉴스 수집    │  │ · 뉴스 요약    │                         │
│  │ · 시장 데이터  │  │ · 감성 분석    │                         │
│  │ · AIS 데이터   │  │ · 이슈 클러스터│                         │
│  │ · 환율/원자재  │  │ · 브리핑 생성  │                         │
│  │ · 항공 데이터  │  │               │                         │
│  │ · Playwright  │  │               │                         │
│  └───────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

외부 데이터 소스:
  ← GDELT, RSS, Playwright (Economist, CNN, NBC, Reuters)
  ← Yahoo Finance (yfinance), Alpha Vantage
  ← AISStream.io (WebSocket)
  ← OpenSky Network, FlightRadar24 (Playwright), AviationStack
  ← Google Gemini API (번역 + AI 분석)

프로세스 관리 (pm2):
  ├── next-server   : Next.js 서버 (프론트엔드 + API)
  └── batch-scheduler: node-cron 배치 (데이터 수집 + AI 처리)
```

### 6.2 데이터 흐름

1. **수집**: 배치 스케줄러(node-cron)가 주기적으로 외부 API/Playwright에서 데이터를 수집
2. **번역**: Gemini API를 사용하여 수집된 데이터를 한국어/영어/일본어 3개 언어로 번역 후 SQLite에 저장
3. **가공**: AI Processor가 Claude API를 호출하여 뉴스 요약, 감성 분석, 브리핑을 생성하고 DB에 저장
4. **제공**: 클라이언트가 Next.js API Routes를 통해 사용자 언어 설정에 맞는 데이터를 로드
5. **알림**: 이상 감지(선박 우회, 긴장도 변화, 급등락) 시 DB에 알림 기록, 클라이언트 폴링으로 표시

### 6.3 프로젝트 구조

```
/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (다크모드, 폰트)
│   ├── page.tsx                  # 대시보드 메인 페이지
│   ├── api/                      # API Routes
│   │   ├── news/route.ts
│   │   ├── markets/route.ts
│   │   ├── vessels/route.ts
│   │   ├── issues/route.ts
│   │   ├── analysis/route.ts
│   │   └── airport/route.ts
│   └── components/               # React 컴포넌트
│       ├── layout/
│       │   ├── TopBar.tsx
│       │   ├── AlertTicker.tsx
│       │   └── MarketTickerBar.tsx
│       ├── map/
│       │   ├── WorldMap.tsx
│       │   └── VesselMap.tsx
│       ├── news/
│       │   └── NewsFeed.tsx
│       ├── issues/
│       │   └── IssueTracker.tsx
│       ├── vessels/
│       │   ├── VesselTracking.tsx
│       │   └── PassageStats.tsx
│       ├── airport/
│       │   ├── AirportMonitor.tsx
│       │   ├── AirportMap.tsx
│       │   ├── AirportTimeline.tsx
│       │   ├── AirlineStatus.tsx
│       │   └── EmiratesRoutes.tsx
│       ├── markets/
│       │   ├── MarketSection.tsx
│       │   ├── IndexCard.tsx
│       │   └── CommodityTable.tsx
│       └── analysis/
│           ├── SentimentGauge.tsx
│           ├── TrendChart.tsx
│           └── AIBriefing.tsx
├── batch/                        # 배치 스케줄러 (별도 프로세스)
│   ├── scheduler.ts              # node-cron 진입점
│   └── collectors/               # 데이터 수집 로직
│       ├── news.ts
│       ├── markets.ts
│       ├── vessels.ts
│       ├── airport.ts            # 항공 데이터 수집
│       └── scraper.ts            # Playwright 스크래핑
├── prisma/
│   └── schema.prisma             # DB 스키마 정의
├── db/
│   └── data.sqlite               # SQLite DB 파일
├── lib/                          # 공유 라이브러리
│   ├── prisma.ts                 # Prisma 클라이언트 싱글턴
│   └── ai.ts                    # Claude API 래퍼
├── i18n/
│   ├── ko.json                   # 한국어
│   ├── en.json                   # 영어
│   └── ja.json                   # 일본어
├── ecosystem.config.js           # pm2 설정 파일
├── package.json
└── tsconfig.json
```

## 7. 비기능 요구사항

- 뉴스 데이터 업데이트 주기: 최소 1시간 이내
- 시장 데이터 업데이트 주기: 시장 개장 시 1분~15분 이내
- 대시보드 페이지 로딩 시간: 3초 이내
- 동시 접속 사용자 지원
- 데이터 보관 기간: 최소 1년
- API Rate Limit 관리: 외부 API 호출 한도 초과 방지

---

## 부록 A. 데이터 소스 상세

### A.1 국제 뉴스

#### 필수 소스 (스크래핑 - Playwright)

| 소스 | URL | 수집 방식 | 비용 | 비고 |
|------|-----|-----------|------|------|
| The Economist | https://www.economist.com/topics/the-world-this-week | Playwright 스크래핑 | 무료 (헤드라인) / 구독 ($30-60/월, 본문) | 안티봇 차단 있음, RSS 접근 불가 |
| CNN World | https://edition.cnn.com/world | Playwright 스크래핑 또는 RSS (`rss.cnn.com/rss/edition_world.rss`) | 무료 | RSS 불안정, Playwright 백업 권장 |
| NBC News World | https://www.nbcnews.com/world | RSS (`feeds.nbcnews.com/nbcnews/public/world`) + Playwright | 무료 | RSS 제공, 상세 내용은 스크래핑 |
| Yahoo Finance | https://finance.yahoo.com | yfinance 라이브러리 + Playwright (뉴스) | 무료 | 시세는 API, 뉴스는 스크래핑 |
| Reuters | https://www.reuters.com | Playwright 스크래핑 | 무료 (헤드라인) | 공개 RSS 중단, 공식 API는 엔터프라이즈 |

#### API/RSS 소스

| 소스 | URL / Endpoint | 수집 방식 | 비용 | Rate Limit |
|------|----------------|-----------|------|------------|
| GDELT | `api.gdeltproject.org/api/v2/doc/doc` | REST API (인증 불요) | 무료 | 제한 없음 |
| NewsAPI | `newsapi.org/v2/everything` | REST API (키 필요) | 무료: 100건/일, 유료: $449/월 | 무료 24시간 딜레이 |
| GNews | `gnews.io/api/v4/search` | REST API (키 필요) | 무료: 100건/일, 유료: €49.99/월 | 무료 12시간 딜레이 |
| BBC World | `feeds.bbci.co.uk/news/world/rss.xml` | RSS (인증 불요) | 무료 | 5~15분 간격 폴링 권장 |
| Al Jazeera | `aljazeera.com/xml/rss/all.xml` | RSS (인증 불요) | 무료 | 제한 없음 |
| AP News | `apnews.com` | NewsAPI/GDELT 간접 수집 | 무료 (간접) | 직접 API는 엔터프라이즈 |

### A.2 주식/지수

| 소스 | 커버리지 | 수집 방식 | 비용 | Rate Limit |
|------|----------|-----------|------|------------|
| Yahoo Finance (yfinance) | KOSPI(`^KS11`), KOSDAQ(`^KQ11`), S&P500(`^GSPC`), NASDAQ(`^IXIC`), DOW(`^DJI`), NIKKEI(`^N225`) | Python 라이브러리 | 무료 | 비공식, ~2,000건/시간 권장 |
| Alpha Vantage | 미국/글로벌 주식, ETF | REST API | 무료: 25건/일, 유료: $49.99/월 | 무료 매우 제한적 |
| Twelve Data | 70+ 시장, 실시간 | REST API + WebSocket | 무료: 800건/일, 유료: $79/월~ | WebSocket은 유료만 |

### A.3 원자재/에너지

| 종목 | 소스 | 티커/Endpoint | 비용 |
|------|------|---------------|------|
| WTI 원유 | Yahoo Finance | `CL=F` | 무료 |
| 브렌트유 | Yahoo Finance | `BZ=F` | 무료 |
| 두바이유 | DME (dubaimerc.com) | Playwright 스크래핑 | 무료 (직접 API 없음) |
| 천연가스 | Yahoo Finance | `NG=F` | 무료 |
| 금 (Gold) | Yahoo Finance | `GC=F` | 무료 |
| 은 (Silver) | Yahoo Finance | `SI=F` | 무료 |
| 구리 (Copper) | Yahoo Finance | `HG=F` | 무료 |
| WTI/Brent (백업) | Alpha Vantage | `function=WTI`, `function=BRENT` | 무료 (25건/일) |

### A.4 환율

| 소스 | 커버리지 | 수집 방식 | 비용 | 비고 |
|------|----------|-----------|------|------|
| ExchangeRate-API (Open) | 160+ 통화 (KRW, JPY, EUR) | REST API (인증 불요) | 무료 | 일 1회 업데이트, 프로토타입에 적합 |
| Open Exchange Rates | 170+ 통화 | REST API (키 필요) | 무료: 1,000건/월, 유료: $12/월~ | 무료는 USD 기준만 |
| Alpha Vantage | 모든 주요 통화쌍 | REST API | 무료: 25건/일 | `FX_INTRADAY`, `FX_DAILY` 등 |
| Yahoo Finance | USD/KRW, EUR/USD, USD/JPY | yfinance (`USDKRW=X` 등) | 무료 | 실시간에 가까움 |

### A.5 선박 추적 (AIS)

| 소스 | URL | 수집 방식 | 비용 | 비고 |
|------|-----|-----------|------|------|
| AISStream.io | `wss://stream.aisstream.io/v0/stream` | WebSocket (키 필요, GitHub 가입) | 무료 (베타) | 실시간 AIS, 바운딩 박스 필터 지원, 최대 50 MMSI, SLA 없음 |
| Kpler (舊 MarineTraffic) | kpler.com | REST API + NMEA 스트림 | 엔터프라이즈 (별도 문의) | 13,000+ 수신기, 2010년부터 이력, 업계 표준 |
| VesselFinder | vesselfinder.com/api | REST API | 유료 (~$150/월~) | 실시간 위치, 항구 기항 |

**중동 해역 모니터링 바운딩 박스 (AISStream용):**
- 페르시아만: `[23.0, 48.0] ~ [30.5, 56.5]`
- 호르무즈 해협: `[25.5, 55.5] ~ [27.0, 57.0]`
- 아덴만/홍해: `[11.0, 41.0] ~ [16.0, 46.0]`
- 바브엘만데브: `[12.0, 43.0] ~ [13.5, 44.0]`
- 수에즈 운하: `[29.5, 32.0] ~ [31.5, 33.0]`

### A.6 지정학 리스크 데이터

| 소스 | URL / Endpoint | 데이터 유형 | 비용 | 비고 |
|------|----------------|-------------|------|------|
| GDELT | `api.gdeltproject.org/api/v2/doc/doc` | 이벤트, 톤 분석, 지리 매핑 | 무료 | 15분 갱신, 65+ 언어, 250M+ 이벤트 |
| GDELT BigQuery | `bigquery-public-data.gdeltv2.gkg` | SQL 쿼리 | 무료: 1TB/월 쿼리 | 전체 이력 (API는 3개월 롤링) |
| ACLED | `acleddata.com/acled-api-documentation` | 분쟁 이벤트 (전투, 시위, 폭력) | 무료 (학술/연구, 가입 필요) | 주간 업데이트, OAuth 2.0 인증 (email/password → access_token) |
| Fragile States Index | fragilestatesindex.org | 국가별 취약성 점수 (12개 지표) | 무료 (다운로드) | 연간 업데이트, 기준선 리스크 평가용 |

### A.7 AI/LLM API (뉴스 요약, 감성 분석)

| 소스 | 모델 | 입력 비용 (MTok) | 출력 비용 (MTok) | 권장 용도 |
|------|------|-----------------|-----------------|-----------|
| Anthropic Claude | Haiku 3.5 | $0.80 | $4.00 | 대량 뉴스 요약 (Batch API 50% 할인) |
| Anthropic Claude | Sonnet 4.6 | $3.00 | $15.00 | 심층 분석, 브리핑 생성 |
| Anthropic Claude | Opus 4.6 | $5.00 | $25.00 | 시나리오 분석, 복잡한 추론 |
| Google Gemini | Flash-Lite 2.5 | $0.10 | $0.40 | **다국어 번역 (EN/KO/JA)**, 최저가 대량 처리 |
| OpenAI | GPT-4o-mini | ~$0.15 | ~$0.60 | 대량 요약 대안 |

### A.8 스크래핑 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| 브라우저 자동화 | **Playwright** | 헤드리스 브라우저, JS 렌더링 지원, 안티봇 우회 |
| 런타임 | Node.js (playwright 패키지) | 백엔드와 동일 TypeScript 환경 |
| 스케줄링 | Bull Queue + node-cron | 사이트별 주기 설정 (1시간 기본) |
| 프록시 | 로테이팅 프록시 (선택) | IP 차단 대응 |
| 파싱 | Cheerio (HTML 파싱) | Playwright 결과에서 데이터 추출 |

**Playwright 스크래핑 대상:**

| 사이트 | URL | 수집 주기 | 수집 항목 |
|--------|-----|-----------|-----------|
| The Economist | `economist.com/topics/the-world-this-week` | 1시간 | 헤드라인, 요약, 카테고리 |
| CNN World | `edition.cnn.com/world` | 30분 | 헤드라인, 요약, 시간, 카테고리 |
| NBC News World | `nbcnews.com/world` | 30분 | 헤드라인, 요약, 시간 |
| Yahoo Finance | `finance.yahoo.com` | 1시간 | 시장 뉴스, 분석 기사 |
| Reuters | `reuters.com/world` | 30분 | 헤드라인, 요약, 시간 |
| DME (두바이유) | `dubaimerc.com` | 1시간 | 두바이유 선물 가격 |
| FlightRadar24 | `flightradar24.com` | 1시간 | DXB 주변 항공기 위치, 항로 |

### A.10 항공 데이터 (두바이 공항 모니터링)

#### 항공편/공항 API

| 소스 | URL / Endpoint | 수집 방식 | 비용 | 비고 |
|------|----------------|-----------|------|------|
| AviationStack | `aviationstack.com/documentation` | REST API (키 필요) | 무료: 100건/월, 유료: $49.99/월~ | 실시간 항공편 추적, 공항 상태, 지연 정보 |
| FlightRadar24 | `flightradar24.com` | Playwright 스크래핑 | 무료 (스크래핑) | 항공기 위치, 항로 시각화, API는 엔터프라이즈 |
| ADS-B Exchange | `adsbexchange.com/data` | REST API | 무료 (커뮤니티) / 유료: $10/월 | 비필터 ADS-B 데이터, 군용기 포함 |
| OpenSky Network | `opensky-network.org/api` | REST API (인증 선택) | 무료 (학술/연구) | 실시간 항공기 위치, 이력 데이터, Rate Limit 있음 |
| FAA NOTAM | `notams.aim.faa.gov` | REST API / Playwright | 무료 | 미국 FAA 발행 NOTAM, 국제 NOTAM 포함 |

#### 수집 대상 데이터

| 데이터 유형 | 소스 | 수집 주기 | 비고 |
|-------------|------|-----------|------|
| DXB 공항 운영 상태 | AviationStack, Playwright (DXB 공식) | 1시간 | 활주로, 기상, 운항 상태 |
| 항공기 실시간 위치 | OpenSky Network, ADS-B Exchange | 1시간 | DXB 반경 300km 바운딩 박스 |
| NOTAM (항공고시보) | FAA NOTAM, Playwright | 1시간 | DXB 및 주변 FIR 관련 |
| 항공사 운항 현황 | AviationStack, Playwright (항공사 사이트) | 1시간 | EK, FZ 등 주요 항공사 편수/정시율 |
| 분쟁/군사 활동 | GDELT, ACLED (A.6 참조) | 1시간 | 항공 영향 이벤트 필터링 |

**DXB 항공기 추적 바운딩 박스:**
- DXB 중심 (300km): `[23.5, 53.5] ~ [27.0, 57.5]`
- 중동 광역 (분쟁구역 포함): `[12.0, 40.0] ~ [38.0, 58.0]`

### A.11 비용 요약 (무료 구성)

| 카테고리 | 주 소스 | 백업 소스 | 비용 |
|----------|---------|-----------|------|
| 국제 뉴스 | GDELT + RSS (BBC, Al Jazeera, NBC) | Playwright (Economist, CNN, Reuters) | 무료 |
| 주식/지수 | Yahoo Finance (yfinance) | Alpha Vantage (무료) | 무료 |
| 원자재 | Yahoo Finance (선물 티커) | Alpha Vantage | 무료 |
| 환율 | ExchangeRate-API (Open) | Yahoo Finance | 무료 |
| 선박 추적 | AISStream.io (WebSocket) | - | 무료 (베타) |
| 지정학 리스크 | GDELT + ACLED | Fragile States Index | 무료 |
| 항공 데이터 | OpenSky Network + Playwright (FlightRadar24) | ADS-B Exchange, AviationStack (무료) | 무료 |
| AI 분석 + 번역 | Gemini Flash-Lite 2.5 / Flash 2.5 | — | 종량제 (~$0.05/일) |

> **참고:** 두바이유 가격은 무료 API가 없으므로 브렌트유를 프록시로 사용하거나 DME 사이트를 Playwright로 스크래핑
