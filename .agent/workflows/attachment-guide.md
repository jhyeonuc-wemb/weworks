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
