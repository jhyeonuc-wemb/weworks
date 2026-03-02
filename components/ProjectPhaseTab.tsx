"use client";

import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { PhaseList } from "./ProjectPhaseTab/PhaseList";
import { PhaseFormModal } from "./ProjectPhaseTab/PhaseFormModal";
import { usePhases } from "./ProjectPhaseTab/usePhases";
import type { ProjectPhase } from "./ProjectPhaseTab/schema";

export interface ProjectPhaseTabHandle {
    handleAdd: (rect?: DOMRect) => void;
}

export const ProjectPhaseTab = forwardRef<ProjectPhaseTabHandle>((_, ref) => {
    const { phases, loading, fetchPhases, savePhase, deletePhase } = usePhases();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchPhases();
    }, [fetchPhases]);

    useImperativeHandle(ref, () => ({
        handleAdd: (rect?: DOMRect) => {
            if (rect) setTriggerRect(rect);
            setEditingPhase(null);
            setIsModalOpen(true);
        }
    }));

    const handleEdit = (phase: ProjectPhase, rect: DOMRect) => {
        setTriggerRect(rect);
        setEditingPhase(phase);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        deletePhase(id);
    };

    const nextOrder = phases.length > 0 ? Math.max(...phases.map(p => p.display_order)) + 1 : 1;

    return (
        <div className="space-y-8">
            <PhaseList
                phases={phases}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <PhaseFormModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                triggerRect={triggerRect}
                editingPhase={editingPhase}
                onSave={savePhase}
                nextOrder={nextOrder}
            />
        </div>
    );
});

ProjectPhaseTab.displayName = "ProjectPhaseTab";
