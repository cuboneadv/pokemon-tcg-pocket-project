# Pokemon TCG Pocket Project - Claude Guidelines

## 프로젝트 개요
- 서비스명: 포켓몬 TCG Pocket 카드 도감 웹사이트
- 기술 스택: HTML/CSS/JavaScript (초기), 추후 확장 예정
- 배포: GitHub Pages
- 언어: 한국어 (카드 데이터는 한/영 전환 지원)

---

## 핵심 원칙 (반드시 준수)

### 1. 단계적 작업 원칙
- 한 번에 하나의 작업만 수행
- 작업 완료 후 반드시 사용자 확인 후 다음 단계 진행
- 절대 여러 작업을 동시에 진행하지 않음

### 2. 토큰 절약 원칙
- 모든 명령은 영어로 수행
- 불필요한 조사/탐색 금지
- 지정된 API/라이브러리 외 임의 탐색 금지
- 모르는 부분은 작업 전 사용자에게 먼저 질문

### 3. 계획 수립 원칙
- 큰 작업 시작 전 반드시 계획 수립
- 계획서(.claude/plans/plan.md) 작성 후 사용자 승인 대기
- 승인 전 절대 작업 시작 금지
- 승인 후 .claude/plans/ 3개 문서 생성 후 작업 시작

### 4. Git 원칙
- 모든 커밋은 .claude/skills/git-skill.md 규칙 준수
- 작업 완료 후 사용자 확인 후 커밋
- 절대 임의로 main 브랜치에 직접 커밋 금지

### 5. 품질검사 원칙
- 모든 작업 완료 후 .claude/hooks/post-task.md 체크리스트 실행
- 오류 발견 시 즉시 수정 후 사용자에게 보고
- 수정 내용은 .claude/logs/changes.md에 기록

---

## 스킬 파일 자동 매칭 규칙

| 키워드 감지 | 활성화 스킬 |
|------------|------------|
| UI, 디자인, 화면, 레이아웃, 카드 목록, 검색, 필터, 반응형 | frontend-skill.md |
| API, fetch, 데이터, TCGdex, 연동, 카드 데이터 | api-skill.md |
| 커밋, 브랜치, 푸시, 배포, GitHub | git-skill.md |
| 로그인, 회원가입, 인증, 세션, 토큰 | auth-skill.md |
| 데이터베이스, DB, 저장, 쿼리, Supabase | database-skill.md |
| 보안, 취약점, XSS, CSRF, 암호화 | security-skill.md |

---

## 스킬 파일 경로
- Frontend: .claude/skills/frontend-skill.md
- API: .claude/skills/api-skill.md
- Git: .claude/skills/git-skill.md
- Auth: .claude/skills/auth-skill.md
- Database: .claude/skills/database-skill.md
- Security: .claude/skills/security-skill.md

---

## 작업 시작 전 체크 (.claude/hooks/pre-task.md 참고)
## 작업 완료 후 체크 (.claude/hooks/post-task.md 참고)
