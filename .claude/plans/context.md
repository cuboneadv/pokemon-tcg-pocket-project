# 맥락 노트 (왜 이렇게 결정했는가)

## 기본 정보
- 관련 작업: 카드 상세 모달 리디자인 + 팩 출현율 데이터 연동 (v1.2.0)
- 이전 작업: TCGdex API 연동 (v1.1.0) — 2026-03-03 완료
- 작성일: 2026-03-03

---

## 1. 결정 사항 기록
| 결정 내용 | 이유 | 결정일 |
|-----------|------|--------|
| TCGdex API 사용 | Pokemon TCG Pocket을 지원하는 유일하게 확인된 무료 공개 API | 2026-03-03 |
| 한/영 전환 = 이미지 URL의 언어 코드 교체 | TCGdex 카드 이미지 자체에 해당 언어 텍스트가 인쇄되어 있음. URL의 ko/en 코드만 바꾸면 한글판/영문판 카드 이미지로 전환됨. 텍스트를 따로 조작할 필요 없음 | 2026-03-03 |
| 카드 목록은 세트 API로, 상세는 클릭 시 별도 호출 | 카드 수가 500+장이므로 전체 상세 일괄 호출 시 과도한 API 요청 발생 | 2026-03-03 |
| localStorage 24시간 캐싱 | API 반복 호출 방지, 오프라인 부분 지원, TCGdex 요청 최소화 | 2026-03-03 |
| 외부 라이브러리 없이 순수 JS만 사용 | 프로젝트 원칙(외부 라이브러리 추가 금지), 번들러 없는 단순 HTML 구조 유지 | 2026-03-03 |
| 이미지 실패 시 타입 그라디언트 폴백 | CDN URL 깨짐 대비, 기존 MVP 디자인 일관성 유지 | 2026-03-03 |
| 단일 index.html 구조 유지 | GitHub Pages 배포 단순성, 현재 단계에서 빌드 도구 불필요 | 2026-03-03 |
| 세트 API 병렬 호출(Promise.all) | 직렬 호출 대비 로딩 시간 대폭 단축 | 2026-03-03 |
| 카드 데이터 관리 전략: Solution A 채택 후 Solution B로 마이그레이션 | TCGdex는 신규 팩 반영에 수일~수주 소요 → 출시 직후 트래픽 급증 시 최신 카드 누락 리스크. 현재(A): TCGdex API + 신규 팩 수동 JSON 보완. 추후(B): Supabase DB를 주 데이터 소스로 전환 + 어드민 관리 페이지. 서비스 안정화 후 B로 이전 | 2026-03-03 |
| 팩 출현율 소스: flibustier/pokemon-tcg-pocket-database | TCGdex는 출현율 데이터 미지원. 오픈소스 DB 중 URL 접근 확인된 유일한 소스. 구조: setId → packType → slots 1~5 → rarityCode: %. 레어도 단위 출현율이므로 카드별 확률은 별도 계산 필요 (추후 작업) | 2026-03-03 |
| 팩 출현율 표시: 레어도 단위 % (카드별 % 아님) | 세트 내 동일 레어도 카드 수를 모르면 카드별 확률 계산 불가. 1단계로 레어도 단위 % 표시 후 추후 정밀화 예정 | 2026-03-03 |
| pullRates.json 캐싱: 기존 cacheGet/cacheSet 재사용 | 새로운 캐싱 로직 불필요. 캐시 키 `tcgp_pull_rates`, TTL 24시간 동일 적용 | 2026-03-03 |
| pullRates.json 프리페치: initCards()와 동시 병렬 호출 | 모달 열기 전 데이터 준비 필요. 카드 목록 로딩과 병렬로 미리 받아두면 모달 지연 없음 | 2026-03-03 |

---

## 2. 참고 자료
- TCGdex API: https://api.tcgdex.net/v2
- TCGdex 문서: https://tcgdex.dev
- 팩 출현율 JSON: https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/pullRates.json
- 참고 디자인: https://ptcgpocket.gg/cards/ (카드 상세 모달 팝업)
- 관련 이슈: 없음

---

## 3. 시도했다가 실패한 것들
- ptcgpocket.gg 모달 디자인 스크래핑 시도: JS 렌더링 페이지라 구조 파악 불가 → 사용자 제공 필드 목록 기준으로 설계

---

## 4. 기술 선택 이유

### TCGdex API 선택 이유
- 선택한 기술: TCGdex API (https://api.tcgdex.net/v2)
- 선택 이유:
  - Pokemon TCG Pocket(tcgp) 시리즈를 명시적으로 지원
  - 무료, 인증 불필요, CORS 허용
  - 카드 이미지 CDN 포함 ({card.image}/high.webp)
  - 한국어(/ko/) 엔드포인트 지원
  - 2025년 기준 활발히 유지보수되는 오픈소스 프로젝트
- 대안으로 고려했던 것:
  - pokemon-tcg.io: TCG Pocket 미지원 (메인라인 TCG만)
  - 자체 데이터 구축: 유지비용 과다, 실현 불가
  - GitHub 오픈 데이터셋: 이미지 CDN 미포함, 유지보수 불확실

### 팩 출현율 소스 선택 이유
- 선택한 기술: flibustier/pokemon-tcg-pocket-database (GitHub raw JSON)
- 선택 이유:
  - TCGdex가 출현율 데이터를 제공하지 않음
  - URL 동작 확인 완료 (2026-03-03)
  - 무료, 인증 불필요, CORS 허용 (GitHub raw CDN)
  - setId 구조가 TCGdex와 동일 (A1, A1a, A2 등)
- 위험: GitHub 레포 삭제/이동 시 소스 소실 → 추후 Supabase DB 이전 시 자체 보관 필요

### localStorage 캐싱 선택 이유
- 선택한 기술: localStorage (브라우저 내장)
- 선택 이유:
  - 외부 라이브러리 없이 사용 가능
  - 24시간 TTL로 API 호출 최소화
  - 카드 데이터는 자주 바뀌지 않으므로 24시간 캐시로 충분
- 대안으로 고려했던 것:
  - IndexedDB: 구현 복잡도 대비 현재 단계에서 과도함
  - Cache API (Service Worker): 오프라인 지원은 추후 작업으로 분리
  - Supabase Storage: 인증/DB 연동 이후 단계에서 적용 예정

---

## 5. 사용자 요구사항 메모
- 요구사항:
  - 카드 상세 모달에 신규 필드 추가:
    - 카드 이미지 + KO/EN 전환 (기존)
    - 카드명 (한국어) (기존)
    - 카드 번호 + 레어도 (기존)
    - HP + 타입 + 스테이지 (기존)
    - 기술 (이름, 에너지 비용, 데미지, 설명) (기존)
    - 약점 + 후퇴 비용 (기존)
    - **팩 정보 (신규)**: 어느 팩/세트 소속인지
    - **팩 출현율 (신규)**: 슬롯 #1~#5 별 출현 확률
    - **일러스트레이터 (신규)**: 카드 일러스트 담당자
  - 참고 디자인: ptcgpocket.gg 카드 모달 팝업
  - 출현율 소스: https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/pullRates.json
- 제약 조건:
  - 순수 HTML/CSS/JS 유지 (빌드 도구 없음)
  - GitHub Pages 배포 가능한 구조 유지
  - 외부 라이브러리 추가 금지
- 추후 고려사항:
  - 카드별 개별 출현율 계산 (세트 내 동일 레어도 총 수 필요)
  - 이미지 영구 보관: Supabase Storage 백업 (인증 기능 개발 이후)
  - 세트별 탐색 기능 (현재는 전체 카드 통합 표시)
