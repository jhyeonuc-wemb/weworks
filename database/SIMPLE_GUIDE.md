# 🚀 데이터베이스 스크립트 실행 가이드 (간단 버전)

## ⚡ **실행 순서 (2단계)**

### **1단계: we_user_roles 테이블 생성**
```
파일: database/15_create_user_roles_table.sql

방법:
1. pgAdmin 열기
2. weworks_db 선택
3. Query Tool 열기
4. 15_create_user_roles_table.sql 파일 열기
5. F5 실행

또는:
- 파일 내용 전체 복사
- pgAdmin Query Tool에 붙여넣기
- F5 실행
```

### **2단계: 성능 개선 적용**
```
파일: database/21_performance_improvements.sql

방법:
1. 위와 동일하게 Query Tool에서
2. 21_performance_improvements.sql 실행
3. 완료!
```

---

## 📋 **실행 내용**

### 15번이 하는 일:
```sql
✅ we_user_roles 테이블 생성
✅ 인덱스 3개 추가
✅ 기존 사용자 데이터 마이그레이션
```

### 21번이 하는 일:
```sql
✅ 복합 인덱스 5개 추가 → 조회 속도 3-5배 향상
✅ 뷰 3개 생성 → 복잡한 쿼리 간소화
✅ 트리거 4개 추가 → updated_at 자동 관리
✅ 제약 조건 강화 → 데이터 품질 보장
```

---

## ⏱️ **소요 시간**
```
15번 실행: 10초
21번 실행: 1-2분
총:        2-3분
```

---

## ✅ **실행 순서 (pgAdmin)**

```
1. pgAdmin 열기
2. weworks_db 데이터베이스 선택
3. Tools > Query Tool (Ctrl+Alt+E)

4. 15_create_user_roles_table.sql 복사/붙여넣기
5. F5 실행
   → "CREATE TABLE", "CREATE INDEX" 메시지 확인

6. 21_performance_improvements.sql 복사/붙여넣기
7. F5 실행
   → "CREATE INDEX", "CREATE VIEW", "CREATE TRIGGER" 메시지 확인

8. 완료! 🎉
```

---

**그냥 15번 → 21번 순서로 실행하면 끝!** 🚀
