import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DraggablePanel, Dropdown, Button } from '@/components/ui';
import { phaseFormSchema, type PhaseFormValues, type ProjectPhase } from './schema';

interface PhaseFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    triggerRect: DOMRect | null;
    editingPhase: ProjectPhase | null;
    onSave: (id: number | null, data: PhaseFormValues) => Promise<boolean>;
    nextOrder: number;
}

export function PhaseFormModal({ isOpen, onOpenChange, triggerRect, editingPhase, onSave, nextOrder }: PhaseFormModalProps) {
    const isEditMode = !!editingPhase;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<PhaseFormValues>({
        resolver: zodResolver(phaseFormSchema as any),
        defaultValues: {
            code: '',
            name: '',
            phase_group: 'sales_ps',
            path: '',
            display_order: nextOrder,
            is_active: true,
            description: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (editingPhase) {
                reset({
                    code: editingPhase.code,
                    name: editingPhase.name,
                    phase_group: editingPhase.phase_group as any,
                    path: editingPhase.path || '',
                    display_order: editingPhase.display_order,
                    is_active: editingPhase.is_active,
                    description: editingPhase.description || '',
                });
            } else {
                reset({
                    code: '',
                    name: '',
                    phase_group: 'sales_ps',
                    path: '',
                    display_order: nextOrder,
                    is_active: true,
                    description: '',
                });
            }
        }
    }, [isOpen, editingPhase, nextOrder, reset]);

    const onSubmit = async (data: PhaseFormValues) => {
        const success = await onSave(editingPhase?.id ?? null, data);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <DraggablePanel
            open={isOpen}
            onOpenChange={onOpenChange}
            triggerRect={triggerRect}
            title={isEditMode ? "단계 정보 수정" : "신규 단계 등록"}
            description="프로젝트 라이프사이클 단계를 정의합니다."
            className="max-w-lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">
                            그룹 구분 <span className="text-primary">*</span>
                        </label>
                        <Controller
                            control={control}
                            name="phase_group"
                            render={({ field }) => (
                                <Dropdown
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={[
                                        { value: 'sales_ps', label: '영업/PS' },
                                        { value: 'project', label: '프로젝트' },
                                        { value: 'maintenance', label: '유지보수' },
                                        { value: 'closure', label: '종료' },
                                    ]}
                                    placeholder="그룹 선택"
                                    variant="standard"
                                />
                            )}
                        />
                        {errors.phase_group && <p className="text-red-500 text-xs mt-1">{errors.phase_group.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">
                            표시 순서 <span className="text-primary">*</span>
                        </label>
                        <input
                            type="number"
                            {...register('display_order', { valueAsNumber: true })}
                            placeholder="예: 1"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                        />
                        {errors.display_order && <p className="text-red-500 text-xs mt-1">{errors.display_order.message}</p>}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">
                        단계 코드 (ID) {!isEditMode && <span className="text-primary">*</span>}
                    </label>
                    <input
                        type="text"
                        disabled={isEditMode}
                        {...register('code')}
                        placeholder="예: lead, opportunity (영문 소문자)"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all disabled:bg-muted/30 disabled:text-muted-foreground/60"
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">
                        단계명 <span className="text-primary">*</span>
                    </label>
                    <input
                        type="text"
                        {...register('name')}
                        placeholder="화면에 표시될 이름"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">경로 (Path)</label>
                    <input
                        type="text"
                        {...register('path')}
                        placeholder="예: /md-estimation (없으면 빈 칸)"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">설명</label>
                    <textarea
                        {...register('description')}
                        placeholder="단계에 대한 설명"
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none transition-all resize-none"
                    />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-100">
                    <input
                        id="is-active"
                        type="checkbox"
                        {...register('is_active')}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="is-active" className="text-xs font-medium text-gray-700 cursor-pointer">
                        사용 여부 (활성화)
                    </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        className="px-8 min-w-[120px]"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '진행 중...' : '저장'}
                    </Button>
                </div>
            </form>
        </DraggablePanel>
    );
}
