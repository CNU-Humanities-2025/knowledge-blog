---
title: "GitHub Pages 배포 테스트"
description: "Obsidian 자료 수집부터 Quartz 빌드와 GitHub Pages 발행까지 이어지는 workflow를 확인하는 테스트 글입니다."
date: "2026-07-28"
modified: "2026-07-28"
publish: true
tags:
  - 분야/시사-금융
  - 형식/테스트
aliases: []
enableToc: true
---

# GitHub Pages 배포 테스트

> [!summary] 한눈에 보기
> 이 문서는 Obsidian과 GitHub 블로그의 통합 발행 workflow가 정상적으로 작동하는지 확인하기 위한 테스트 글입니다.

## 확인 대상

이번 테스트에서는 다음 과정을 확인합니다.

1. Markdown 글이 Quartz의 공개 콘텐츠로 인식되는가
2. GitHub Actions에서 Quartz 빌드가 정상적으로 완료되는가
3. 생성된 사이트가 GitHub Pages에 배포되는가

## 통합 workflow

앞으로는 링크를 Obsidian reference vault에 수집하고, 저장된 reference note와 PDF를 바탕으로 글을 작성합니다. 완성한 글에 `publish: true`를 설정한 뒤 발행 준비 명령을 실행하면 공개 글만 GitHub 저장소로 복사됩니다.

```powershell
npm run publish:prepare
```

PDF archive와 비공개 reference note는 공개 저장소에 포함되지 않으며, 글에서 사용한 reference note 링크는 원문 웹 URL로 변환됩니다.

## 테스트 결론

이 문서가 블로그에서 보이면 로컬 작성, GitHub Actions 빌드, GitHub Pages 배포 경로가 정상적으로 연결된 것입니다.
