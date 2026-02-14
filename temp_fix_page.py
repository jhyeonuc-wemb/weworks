#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# page.tsx 파일에서 제품 계획 탭을 ProductPlanTab 컴포넌트로 교체

import codecs

file_path = r"C:\Users\hyeonuc\weworks\app\(main)\projects\[id]\profitability\page.tsx"

# UTF-8로 파일 읽기
with codecs.open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 916줄(인덱스 915)부터 1808줄(인덱스 1807)까지를 교체
# 916줄: {activeTab === "product-plan" && (
# 1808줄: )}

# 새로운 라인: {activeTab === "product-plan" && <ProductPlanTab />}

new_lines = lines[:915]  # 0-914줄
new_lines.append('         {activeTab === "product-plan" && <ProductPlanTab />}\n')  # 915줄 (916줄)
new_lines.extend(lines[1808:])  # 1809줄부터

# UTF-8 BOM 없이 저장
with codecs.open(file_path, 'w', encoding='utf-8-sig') as f:
    f.writelines(new_lines)

print("File updated successfully!")
print(f"Removed lines: {1808 - 915}")
print(f"New total lines: {len(new_lines)}")
