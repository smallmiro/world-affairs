# World Affairs Dashboard

국제 정세 모니터링 대시보드 (SIGINT). Next.js + Prisma + SQLite 기반.

## 기술 스택

- **Frontend + Backend**: Next.js (App Router) + TypeScript
- **ORM / DB**: Prisma + SQLite
- **배치 스케줄러**: node-cron (별도 프로세스)
- **프로세스 관리**: pm2
- **UI**: MUI v5 + Tailwind CSS + react-leaflet + Recharts
- **데이터 수집**: GDELT, RSS, OpenSky, AviationStack, Yahoo Finance
- **AI**: Gemini API (번역/요약/감성/브리핑)

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
GEMINI_API_KEY=your_key
AVIATIONSTACK_API_KEY=your_key
OPENSKY_USERNAME=your_username        # Optional
OPENSKY_PASSWORD=your_password        # Optional
```

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
| `world-affairs-batch` | 배치 스케줄러 (7개 cron job) | - |

### 3. 상태/로그 확인

```bash
pm2 status                         # 프로세스 상태
pm2 logs                           # 전체 실시간 로그
pm2 logs world-affairs-batch       # 배치 로그만
```

### 4. 운영 명령어

```bash
pm2 restart all     # 전체 재시작
pm2 stop all        # 전체 중지
pm2 delete all      # 전체 삭제
pm2 save            # 현재 상태 저장 (재부팅 후 자동 복구)
pm2 startup         # 시스템 부팅 시 자동 시작 등록
```

## 배치 스케줄

| Job | Cron | 주기 | 데이터 소스 | 시작 시 실행 |
|-----|------|------|------------|------------|
| `collect-news` | `*/15 * * * *` | 15분마다 | GDELT + RSS | O |
| `collect-market` | `*/15 * * * *` | 15분마다 | Yahoo Finance | O |
| `collect-geo` | `*/30 * * * *` | 30분마다 | GDELT Events | O |
| `airport:flights` | `0 * * * *` | 매시 정각 | OpenSky | O |
| `airport:ops` | `0 6,18 * * *` | 하루 2회 (06:00, 18:00) | AviationStack | X (Free tier 절약) |
| `airport:events` | `0 */4 * * *` | 4시간마다 | GDELT Airport | O |
| `airport:cleanup` | `0 3 * * *` | 매일 03:00 | - (7일 보존) | X |

## API 엔드포인트

| Endpoint | Method | 파라미터 |
|----------|--------|---------|
| `/api/news` | GET | `lang`, `limit`, `region`, `category` |
| `/api/markets` | GET | `type` |
| `/api/geo-events` | GET | `lang`, `limit`, `severity`, `eventType` |
| `/api/vessels` | GET | `type`, `zone` |
| `/api/airport` | GET | `section` (status\|flights\|events\|airlines\|routes), `limit` |
| `/api/analysis/briefing` | GET | `lang` |

## 테스트

```bash
npm run test        # vitest 실행
npx tsc --noEmit    # 타입 체크
```

## 프로젝트 구조

```
app/                  # Next.js App Router (프론트 + API)
src/
  domain/             # 도메인 엔티티 + 포트 (순수 비즈니스)
  adapters/           # 포트 구현체 (DB, 외부 API)
  usecases/           # 유스케이스 (도메인 오케스트레이션)
  infrastructure/     # 프레임워크 설정 (prisma, gemini)
  batch/              # 배치 스케줄러 (node-cron)
  shared/             # 공통 타입, 유틸
prisma/               # DB 스키마 + 마이그레이션
db/                   # SQLite DB 파일
docs/                 # PRD, 프로토타입
```
