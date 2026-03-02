import { useState, useCallback } from 'react';
import type { ProjectPhase, PhaseFormValues } from './schema';
import { useToast } from '@/components/ui';

export function usePhases() {
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast, confirm } = useToast();

    const fetchPhases = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/phases');
            if (response.ok) {
                const data = await response.json();
                setPhases(data.phases || []);
            }
        } catch (error) {
            console.error('Error fetching phases:', error);
            showToast('데이터 불러오기에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const savePhase = async (id: number | null, payload: PhaseFormValues) => {
        try {
            const isEdit = !!id;
            const response = await fetch('/api/settings/phases', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEdit ? { id, ...payload } : payload),
            });

            if (response.ok) {
                await fetchPhases();
                showToast(isEdit ? '단계가 수정되었습니다.' : '새 단계가 추가되었습니다.', 'success');
                return true;
            } else {
                const error = await response.json();
                showToast(`${isEdit ? '수정' : '추가'} 실패: ${error.error}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving phase:', error);
            showToast('저장에 실패했습니다.', 'error');
            return false;
        }
    };

    const deletePhase = async (id: number) => {
        confirm({
            title: '단계 삭제',
            message: '정말 이 단계를 삭제하시겠습니까? 프로젝트에 영향이 있을 수 있습니다.',
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/settings/phases?id=${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        await fetchPhases();
                        showToast('단계가 삭제되었습니다.', 'success');
                    } else {
                        const error = await response.json();
                        showToast(`삭제 실패: ${error.error || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting phase:', error);
                    showToast('삭제에 실패했습니다.', 'error');
                }
            }
        });
    };

    return {
        phases,
        loading,
        fetchPhases,
        savePhase,
        deletePhase,
    };
}
