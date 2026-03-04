import { ProjectRepository, GetProjectsFilters, CreateProjectParams } from '../repositories/project.repository';
import { ValidationError } from '../core/errors';
import { mapToCamelCase } from '../utils/mapper';
import { initProjectPhases } from '../phase';

export class ProjectService {
    /**
     * 프로젝트 목록 조회 비즈니스 로직
     */
    static async getProjects(filters: GetProjectsFilters) {
        const rawProjects = await ProjectRepository.findAll(filters);

        const formattedProjects = rawProjects.map((row: any) => {
            return {
                ...row,
                current_phase: row.computed_phase,
                status: row.computed_status,
            };
        });

        return mapToCamelCase(formattedProjects);
    }

    /**
     * 신규 프로젝트 생성 비즈니스 로직
     * 생성 후 전체 단계를 STANDBY로 초기화합니다.
     */
    static async createProject(data: Partial<CreateProjectParams> & { createdBy: number, name: string }) {
        if (!data.name) {
            throw new ValidationError('프로젝트 이름은 필수입니다.');
        }

        // 사용자가 선택한 단계가 있으면 사용, 없으면 null (initProjectPhases가 첫 단계 반환)
        const selectedPhase = data.processStatus || undefined;

        const params: CreateProjectParams = {
            name: data.name,
            projectCode: data.projectCode,
            maintenanceFreeCode: data.maintenanceFreeCode,
            maintenancePaidCode: data.maintenancePaidCode,
            researchCode: data.researchCode,
            categoryId: data.categoryId,
            projectTypeId: data.projectTypeId,
            customerId: data.customerId,
            ordererId: data.ordererId,
            description: data.description,
            contractStartDate: data.contractStartDate,
            contractEndDate: data.contractEndDate,
            actualStartDate: data.actualStartDate,
            actualEndDate: data.actualEndDate,
            expectedAmount: data.expectedAmount,
            currency: data.currency,
            managerId: data.managerId,
            salesRepresentativeId: data.salesRepresentativeId,
            processStatus: selectedPhase,
            currentPhase: selectedPhase || 'tbd', // 임시값, 아래에서 실제값으로 교체
            riskLevel: data.riskLevel,
            fieldId: data.fieldId,
            createdBy: data.createdBy,
        };

        // 1. 프로젝트 생성
        const projectId = await ProjectRepository.create(params);

        // 2. 전체 단계 STANDBY 초기화, 첫 번째 단계 코드 반환
        const firstPhaseCode = await initProjectPhases(projectId);

        // 3. current_phase를 사용자 선택 단계 또는 첫 단계로 업데이트
        const finalPhase = selectedPhase || firstPhaseCode || undefined;
        if (finalPhase) {
            await ProjectRepository.updateCurrentPhase(projectId, finalPhase);
        }

        return projectId;
    }
}
