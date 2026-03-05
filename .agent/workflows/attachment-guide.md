---
description: 첨부파일 기능을 새로운 화면에 추가하는 방법
---

# 첨부파일 기능 추가 가이드

## 구조 개요

- **DB**: `we_attachments` (entity_type + entity_id 패턴)
- **API**: `GET/POST /api/attachments`, `GET/DELETE /api/attachments/[id]`
- **컴포넌트**: `@/components/ui/AttachmentSection`
- **파일 저장 위치**: `public/uploads/{entityType}/{entityId}/`

## entity_type 규칙

| 화면 | entityType |
|---|---|
| 계약 현황 | `contract` |
| VRB 심의 | `vrb` |
| 수지분석 | `profitability` |
| 정산 | `settlement` |
| MD 산정 | `md` |

신규 화면 추가 시 위 표에 규칙을 추가해 주세요.

## 새 화면에 적용하기

1. **import 추가**
```tsx
import { AttachmentSection } from "@/components/ui";
```

2. **JSX에 섹션 추가** (보통 `p-8 space-y-8` 컨테이너 하단)
```tsx
{/* ── 첨부파일 ── */}
<div className="pt-2">
    <div className="h-px bg-gray-100 mb-6" />
    <AttachmentSection
        entityType="vrb"         // entity_type 규칙 참조
        entityId={Number(id)}   // 프로젝트 ID
        readonly={isReadOnly}   // 완료 상태면 true
    />
</div>
```

3. **끝.** DB, API, 파일 저장 모두 자동으로 처리됩니다.

## AttachmentSection Props

| Prop | 타입 | 필수 | 설명 |
|---|---|---|---|
| `entityType` | string | ✅ | 화면 구분자 (`contract`, `vrb` 등) |
| `entityId` | number | ✅ | 프로젝트 ID |
| `readonly` | boolean | - | true면 업로드/삭제 버튼 비활성, 목록만 표시 |
| `className` | string | - | 추가 스타일 |

## 파일서버 전환 시

`app/api/attachments/route.ts` POST 핸들러에서 `writeFile` 부분을 파일서버 업로드 로직으로 교체하고,
`file_path` 컬럼 값을 파일서버 URL로 저장하면 됩니다. 나머지 코드는 변경 없음.

## 보안 필터 (업로드 차단 확장자)

`lib/utils/file-security.ts`의 `BLOCKED_EXTENSIONS`에서 관리합니다.
클라이언트(선택 즉시)와 서버(저장 전) 양쪽에서 모두 검증합니다.

**현재 차단 범주:**

| 범주 | 예시 |
|---|---|
| 실행 파일 | exe, bat, cmd, com, msi |
| 스크립트 | ps1, vbs, sh, py, rb, js |
| 시스템 | dll, sys, drv, scr, reg |
| 웹 실행 | php, asp, aspx, jsp, cgi |
| 기타 | jar, lnk, iso, swf |

**차단 확장자 추가/제거 방법:**
```ts
// lib/utils/file-security.ts
export const BLOCKED_EXTENSIONS = new Set([
    "exe", "bat", // ... 기존 목록
    "xyz",  // ← 추가
]);
```
서버 재시작 없이 파일만 수정하면 클라이언트·서버 모두 자동 반영됩니다.

