# 할 일 체크리스트

## 기본 정보
- 관련 작업: 카드 상세 모달 리디자인 + 팩 출현율 데이터 연동 (v1.2.0)
- 시작일: TBD (사용자 승인 후)
- 목표 완료일: TBD

---

## 진행 현황
- 전체 작업: 9개
- 완료: 0개
- 진행 중: 0개
- 미완료: 9개

---

## 체크리스트

### 준비 단계
- [x] 계획서 작성 완료 (plan.md)
- [x] 맥락 노트 작성 완료 (context.md)
- [x] pullRates.json URL 동작 확인 완료
- [ ] 사용자 승인 완료
- [x] 관련 스킬 파일 확인 완료 (api-skill.md, frontend-skill.md)

### 작업 단계
- [ ] 0단계: feature/modal-redesign 브랜치 생성 (feature/api-integration에서 분기)
- [ ] 1단계: normaliseCard()에 illustrator, setName 필드 추가
- [ ] 2단계: fetchPullRates() 함수 작성 + localStorage 캐싱 (tcgp_pull_rates, 24h TTL)
- [ ] 3단계: RARITY_CODE 매핑 테이블 + getRatesForCard() 헬퍼 작성
- [ ] 4단계: 모달 HTML 템플릿 리디자인 (팩 정보, 출현율 테이블, 일러스트레이터 섹션 추가)
- [ ] 5단계: 신규 모달 섹션 CSS 작성
- [ ] 6단계: initCards() 수정 — pullRates를 카드 목록과 병렬 프리페치
- [ ] 7단계: 전체 기능 테스트 (신규 필드 표시, 출현율 슬롯 테이블, 엣지케이스)
- [ ] 8단계: feature/api-integration에 머지

### 완료 단계
- [ ] 품질 검사 통과 (아래 체크리스트 전 항목)
- [ ] 사용자 확인 완료
- [ ] feature/api-integration → develop 머지 (사용자 확인 후)
- [ ] GitHub push 완료
- [ ] changes.md 업데이트 완료

---

## API 체크리스트 (api-skill.md 기준)
- [ ] fetchPullRates() — try/catch 에러 처리 있음
- [ ] fetchPullRates() — 로딩 실패 시 출현율 섹션 숨김 (silent fail)
- [ ] fetchPullRates() — localStorage 캐싱 24시간 적용
- [ ] getRatesForCard() — setId 없는 카드 처리 (graceful fallback)
- [ ] getRatesForCard() — 레어도 매핑 없는 코드 처리 (슬롯 "—" 표시)
- [ ] pullRates.json과 TCGdex setId 일치 여부 확인

## 프론트엔드 체크리스트 (frontend-skill.md 기준)
- [ ] 모달 신규 섹션 레이아웃 — 데스크탑(1280px 이상) 정상 표시
- [ ] 슬롯 출현율 테이블 — 5칸 균등 배분
- [ ] 팩 정보 없는 카드 — 팩 섹션 숨김 처리
- [ ] 일러스트레이터 없는 카드 — 일러스트레이터 섹션 숨김 처리
- [ ] 기술 없는 카드 (트레이너/에너지) — 기술 섹션 숨김 처리
- [ ] 한국어 텍스트 정상 표시
- [ ] 외부 라이브러리 추가 없음

---

## 이슈 기록
| 이슈 내용 | 발생일 | 해결 여부 | 해결 방법 |
|-----------|--------|-----------|-----------|
| (작업 진행 중 기록 예정) | | | |

---

## 이전 작업 이력 (v1.1.0 — TCGdex API 연동)
- 완료일: 2026-03-03
- 주요 구현: loadAllCards, fetchCardDetail, 캐싱, 스켈레톤 UI, 한/영 이미지 전환
- 이슈: openModal에서 Number(card.dataset.id) → NaN 버그 수정 (string ID 직접 전달로 해결)
