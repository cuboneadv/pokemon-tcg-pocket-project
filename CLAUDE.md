# 프로젝트 규칙 (Pokemon TCG Pocket 도감)

## 브랜치 전략

```
main
└── develop
    ├── feature/xxx   (신규 기능)
    └── hotfix/xxx    (긴급 버그 수정 → main 직접 머지 후 develop 반영)
```

- 모든 기능 개발은 `develop`에서 `feature/xxx` 브랜치를 분기해서 작업한다.
- 기능 완료 시 `develop`에 먼저 머지한 후, 검증이 끝나면 `main`에 머지한다.
- `main`은 항상 배포 가능한 상태를 유지한다.

## 버전 관리

[Semantic Versioning](https://semver.org/) 규칙을 따른다: **vMAJOR.MINOR.PATCH**

| 구분 | 올리는 경우 |
|------|------------|
| MAJOR | 하위 호환이 깨지는 변경 |
| MINOR | 하위 호환을 유지하는 신규 기능 추가 |
| PATCH | 하위 호환을 유지하는 버그 수정 |

예시: `v1.0.0` → `v1.1.0` (기능 추가) → `v1.1.1` (버그 수정)

## 커밋 메시지 형식

```
type: 변경 내용을 간결하게 설명
```

| type | 용도 |
|------|------|
| `feat` | 신규 기능 추가 |
| `fix` | 버그 수정 |
| `design` | UI/스타일 변경 |
| `docs` | 문서 작성 및 수정 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `chore` | 빌드 설정, 패키지 업데이트 등 기타 작업 |

**예시**
```
feat: 카드 타입 필터 기능 추가
fix: 모달 닫기 버튼 클릭 오류 수정
design: 카드 호버 애니메이션 개선
docs: README에 실행 방법 추가
refactor: 카드 렌더링 함수 분리
chore: .gitignore 업데이트
```

## GitHub 커밋 규칙

- **GitHub에 커밋(push)하기 전에 반드시 먼저 확인을 요청한다.**
- 로컬 커밋은 자유롭게 진행해도 되지만, `git push` 전에는 항상 물어본다.

## 머지 절차

1. 기능 완료 → `feature/xxx`에서 `develop`으로 PR/머지
2. `develop` 검증 완료 → `develop`에서 `main`으로 PR/머지
3. `main` 머지 후 버전 태그 부여 (예: `git tag v1.1.0`)
