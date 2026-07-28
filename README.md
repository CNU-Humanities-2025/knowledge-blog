# 시사 · 과학 · 테크 노트

Obsidian에서 글을 쓰고 [Quartz 5](https://quartz.jzhao.xyz/)로 변환해 GitHub Pages에 자동 배포하는 개인 블로그입니다.

## 폴더 구성

```text
content/                       ← 공개할 글이 자동 복사되는 Quartz 입력 폴더
├─ 00-inbox/                   ← 글감과 미분류 메모(웹에서 제외)
├─ 90-drafts/                  ← 장문 초안(웹에서 제외)
├─ current-affairs-finance/    ← 시사 · 금융
├─ math-physics-cs/            ← 수학 · 물리 · CS
├─ tech-industry/              ← 테크 산업
├─ templates/                  ← Obsidian 글 템플릿(웹에서 제외)
├─ assets/                     ← 이미지와 첨부파일
└─ private/                    ← Git에도 올라가지 않는 비공개 자료
```

## 연결 상태

- 기본 Obsidian vault: `E:\Obsidian Vault`
- GitHub 저장소: [CNU-Humanities-2025/knowledge-blog](https://github.com/CNU-Humanities-2025/knowledge-blog)
- GitHub Pages: [시사 · 과학 · 테크 노트](https://cnu-humanities-2025.github.io/knowledge-blog/)
- 로컬 미리보기: 저장소 루트에서 `npm run dev`

커스텀 도메인을 쓸 경우에만 `quartz.config.yaml`의 `@quartz-community/cname` 플러그인을 활성화합니다.

## 글 쓰고 발행하기

기존 PDF reference vault와 블로그를 함께 사용할 때는 아래의 **통합 발행 workflow**를 권장합니다.

### 처음 한 번

저장소 루트의 PowerShell에서 실행합니다.

```powershell
npm run obsidian:init
```

이 명령은 기존 `E:\Obsidian Vault`에 다음 작업 공간과 글 템플릿을 추가합니다.

```text
Blog/
├─ 90-drafts/
├─ current-affairs-finance/
├─ math-physics-cs/
└─ tech-industry/

Templates/GitHub Blog Article.md
```

기존 reference note와 PDF는 이동하거나 수정하지 않습니다.

### 매번 쓰고 발행할 때

1. `Paste URL and Archive.cmd`로 링크를 넣어 reference note와 PDF를 수집합니다.
2. Obsidian에서 `GitHub Blog Article` 템플릿으로 `Blog/90-drafts/`에 글을 씁니다.
3. `## 참고 자료`에 `[[References/Articles/...]]` 또는 `[[References/X/...]]` 링크를 답니다.
4. 완성한 글을 `Blog/` 아래 세 분야 중 알맞은 폴더로 옮기고 `publish: true`로 바꿉니다.
5. 저장소 루트에서 아래 명령을 실행합니다.

```powershell
npm run publish:prepare
```

이 명령은 공개 글만 `content/`로 복사하고, reference note 위키 링크를 원문 웹 URL로 바꾼 뒤 사이트 빌드까지 검사합니다. reference PDF와 비공개 노트는 GitHub 저장소에 복사하지 않습니다.

6. 로컬 결과를 확인한 뒤 Git에 커밋하고 GitHub로 push하면 GitHub Actions가 사이트를 자동 배포합니다.

> `publish: false`인 Markdown은 웹 빌드에서 빠지지만, 공개 GitHub 저장소에 커밋하면 원문은 보일 수 있습니다. 정말 비공개인 자료는 `content/private/`에 두세요. 이 폴더는 `.gitignore`에 포함되어 있습니다.

## GitHub Pages 연결

저장소를 GitHub에 올린 뒤 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다. 배포 워크플로는 `.github/workflows/deploy.yml`에 준비되어 있습니다.

## 자주 쓰는 명령

```powershell
npm run dev       # 로컬 미리보기
npm run build     # 정적 사이트 생성 및 검증
npm run obsidian:init       # 처음 한 번: 통합 글쓰기 폴더와 템플릿 준비
npm run obsidian:sync       # publish: true인 Obsidian 글만 저장소로 복사
npm run publish:prepare     # 동기화 후 실제 Quartz 빌드까지 검증
git status        # 변경 파일 확인
git add .
git commit -m "글 제목"
git push
```

## 권장 태그 규칙

- 분야: `분야/시사-금융`, `분야/수학-물리-CS`, `분야/테크-산업`
- 글 성격: `형식/해설`, `형식/분석`, `형식/튜토리얼`, `형식/리뷰`
- 세부 주제: `주제/거시경제`, `주제/AI`, `주제/알고리즘`처럼 필요한 만큼 추가

폴더는 큰 주제 세 개만 안정적으로 유지하고, 세부 분류는 태그와 `[[위키 링크]]`로 연결하는 방식을 권장합니다.
