"use client";

import { useEffect, useState } from "react";
import { Dropdown } from "./Dropdown";

interface StatusDropdownProps {
    status: string;
    onStatusChange: (status: string) => void;
    disabled?: boolean;
    className?: string;
    phase?: string; // e.g. 'MD_ESTIMATION', 'VRB', 'PROFITABILITY', 'SETTLEMENT'
}

const defaultStatusOptions = [
    { value: "STANDBY", label: "대기" },
    { value: "IN_PROGRESS", label: "작성 중" },
    { value: "COMPLETED", label: "완료" },
    { value: "APPROVED", label: "승인" },
    { value: "REJECTED", label: "반려" },
];

export const StatusDropdown = ({ status, onStatusChange, disabled, className, phase }: StatusDropdownProps) => {
    const [options, setOptions] = useState<{ value: string; label: string }[]>(defaultStatusOptions);

    useEffect(() => {
        if (phase) {
            fetch(`/api/common-codes?parentCode=${phase}`)
                .then(res => res.json())
                .then(data => {
                    if (data.codes && data.codes.length > 0) {
                        setOptions(data.codes.map((code: any) => ({
                            value: code.code,
                            label: code.name
                        })));
                    }
                })
                .catch(err => console.error("Failed to fetch status codes:", err));
        }
    }, [phase]);

    // M/D 산정 등 일부 모듈에서 사용하는 draft, completed 매핑 지원 (Legacy Support)
    // 하지만 가급적 서버에서 표준 코드를 내려주도록 유도
    const getMappedStatus = (s: string) => {
        if (s === 'draft') return 'IN_PROGRESS';
        if (s === 'completed') return 'COMPLETED';
        if (s === 'approved') return 'APPROVED';
        return s;
    };

    const currentStatus = getMappedStatus(status);

    // 현재 상태가 목록에 없으면, 원본 상태를 보여주는 옵션 추가 (안전장치)
    const displayOptions = [...options];
    if (!options.find(opt => opt.value === currentStatus)) {
        displayOptions.push({ value: currentStatus, label: currentStatus });
    }

    return (
        <Dropdown
            value={currentStatus}
            onChange={(val) => onStatusChange(val as string)}
            options={displayOptions}
            variant="premium"
            className={className || "w-32"}
            placeholder="상태 선택"
            disabled={disabled}
            align="center"
        />
    );
};
