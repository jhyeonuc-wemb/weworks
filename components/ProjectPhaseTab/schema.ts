import { z } from 'zod';

export const phaseFormSchema = z.object({
    code: z.string().min(1, '단계 코드는 필수입니다.'),
    name: z.string().min(1, '단계명은 필수입니다.'),
    phase_group: z.enum(['sales_ps', 'project', 'maintenance', 'closure']),
    path: z.string().nullable().optional().transform(v => v || ""),
    display_order: z.number().int().min(0, '표시 순서는 0 이상이어야 합니다.'),
    is_active: z.boolean(),
    description: z.string().nullable().optional().transform(v => v || ""),
});

export type PhaseFormValues = z.infer<typeof phaseFormSchema>;

export interface ProjectPhase {
    id: number;
    code: string;
    name: string;
    phase_group: string;
    path: string | null;
    display_order: number;
    is_active: boolean;
    description: string | null;
}
