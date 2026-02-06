import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/profitability/[id]/export
 * Fetch all profitability data for Excel export
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id, 10);

        if (isNaN(projectId)) {
            return NextResponse.json(
                { error: 'Invalid project ID' },
                { status: 400 }
            );
        }

        // Fetch project info
        const projectResult = await query(
            `SELECT p.id, p.name, p.project_code, p.currency, c.name as customer_name
       FROM we_projects p
       LEFT JOIN we_clients c ON p.customer_id = c.id
       WHERE p.id = $1`,
            [projectId]
        );

        if (projectResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const project = projectResult.rows[0];

        // Fetch profitability header
        const headerResult = await query(
            `SELECT * FROM we_project_profitability
       WHERE project_id = $1
       ORDER BY version DESC
       LIMIT 1`,
            [projectId]
        );

        const header = headerResult.rows[0] || {};

        // Fetch product plan
        const productPlanResult = await query(
            `SELECT * FROM we_project_product_plan
       WHERE project_id = $1
       ORDER BY id`,
            [projectId]
        );

        // Fetch manpower plan
        const manpowerPlanResult = await query(
            `SELECT * FROM we_project_manpower_plan
       WHERE project_id = $1
       ORDER BY id`,
            [projectId]
        );

        // Fetch project expense
        const projectExpenseResult = await query(
            `SELECT * FROM we_project_expense_plan
       WHERE project_id = $1
       ORDER BY id`,
            [projectId]
        );

        // Fetch standard expenses
        const standardExpenseResult = await query(
            `SELECT * FROM we_project_profitability_standard_expenses
       WHERE project_id = $1
       ORDER BY id`,
            [projectId]
        );

        // Fetch standard prices (unit prices)
        const year = new Date().getFullYear();
        const standardPriceResult = await query(
            `SELECT * FROM we_unit_prices
       WHERE year = $1
       ORDER BY grade`,
            [year]
        );

        // Construct export data
        const exportData = {
            summary: {
                projectName: project.name,
                customerName: project.customer_name,
                projectCode: project.project_code,
                currency: project.currency || 'KRW',
                totalRevenue: header.total_revenue || 0,
                totalCost: header.total_cost || 0,
                netProfit: header.net_profit || 0,
                profitRate: header.profit_rate || 0,
            },
            orderProposal: {
                projectName: project.name,
                customerName: project.customer_name,
                serviceRevenue: manpowerPlanResult.rows.map((item: any) => ({
                    name: item.grade || '',
                    amount: item.total_amount || 0,
                })),
                productRevenue: productPlanResult.rows.map((item: any) => ({
                    name: item.product_name || '',
                    amount: item.total_amount || 0,
                })),
            },
            profitabilityDiff: {
                softwareRevenue: header.software_revenue || 0,
                hardwareRevenue: header.hardware_revenue || 0,
                laborCost: header.labor_cost || 0,
                otherCost: header.other_cost || 0,
                // Calculate service revenue from manpower plan
                internalServiceRevenue: manpowerPlanResult.rows
                    .filter((item: any) => item.affiliation_group === '당사')
                    .reduce((sum: number, item: any) => sum + (item.proposed_amount || 0), 0),
                externalServiceRevenue: manpowerPlanResult.rows
                    .filter((item: any) => item.affiliation_group === '외주')
                    .reduce((sum: number, item: any) => sum + (item.proposed_amount || 0), 0),
            },
            productPlan: {
                items: productPlanResult.rows.map((item: any) => ({
                    productName: item.product_name,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    totalAmount: item.total_amount,
                    remarks: item.remarks,
                })),
            },
            manpowerPlan: {
                items: manpowerPlanResult.rows.map((item: any) => ({
                    grade: item.grade,
                    headcount: item.headcount,
                    mm: item.mm,
                    unitPrice: item.unit_price,
                    totalAmount: item.total_amount,
                    remarks: item.remarks,
                })),
            },
            projectExpense: {
                items: projectExpenseResult.rows.map((item: any) => ({
                    expenseName: item.expense_name,
                    amount: item.amount,
                    remarks: item.remarks,
                })),
            },
            standardPrice: {
                prices: standardPriceResult.rows.map((item: any) => ({
                    grade: item.grade,
                    unitPrice: item.unit_price,
                    year: item.year,
                })),
            },
            standardExpense: {
                expenses: [
                    {
                        item: '야근식대',
                        category: '내부',
                        standardType: '월*인',
                        standardDetail: '인당 10,000원/일',
                        inputValue: 10,
                        calculatedValue: standardExpenseResult.rows.find((r: any) => r.row_id === 1)?.calculated_value ?? 22,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 1)?.final_amount ?? 0,
                    },
                    {
                        item: '프로젝트부서비',
                        category: '내부',
                        standardType: '월*인',
                        standardDetail: '인당 25,000원',
                        inputValue: null,
                        calculatedValue: 25,
                        finalAmount: 25,
                    },
                    {
                        item: '프로젝트부서비',
                        category: '외주',
                        standardType: '월*인',
                        standardDetail: '인당 50,000원',
                        inputValue: null,
                        calculatedValue: 50,
                        finalAmount: 50,
                    },
                    {
                        item: '워크샵',
                        category: '',
                        standardType: '횟수*인',
                        standardDetail: '1인당 50,000원, 분기당 1회 이내',
                        inputValue: null,
                        calculatedValue: null,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 4)?.final_amount ?? 0,
                    },
                    {
                        item: 'Kick-Off 비용',
                        category: '',
                        standardType: '횟수*인',
                        standardDetail: '1인당 150,000원, 시작월 및 종료월',
                        inputValue: null,
                        calculatedValue: null,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 5)?.final_amount ?? 0,
                    },
                    {
                        item: '지방 임차비',
                        category: '',
                        standardType: '',
                        standardDetail: '인당 50,000원/일',
                        inputValue: 50,
                        calculatedValue: standardExpenseResult.rows.find((r: any) => r.row_id === 6)?.calculated_value ?? 1,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 6)?.final_amount ?? 0,
                    },
                    {
                        item: '지방 출장비(월 22일 기준 일 20,000원 반영)',
                        category: '',
                        standardType: '',
                        standardDetail: '인당 20,000원/일',
                        inputValue: 20,
                        calculatedValue: standardExpenseResult.rows.find((r: any) => r.row_id === 7)?.calculated_value ?? 22,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 7)?.final_amount ?? 0,
                    },
                    {
                        item: '출장교통비 - 항공권,KTX,렌터카,주유비 등',
                        category: '',
                        standardType: '',
                        standardDetail: '인당 100,000원/일',
                        inputValue: 100,
                        calculatedValue: standardExpenseResult.rows.find((r: any) => r.row_id === 8)?.calculated_value ?? 1,
                        finalAmount: standardExpenseResult.rows.find((r: any) => r.row_id === 8)?.final_amount ?? 0,
                    },
                    {
                        item: '기타',
                        category: '',
                        standardType: '',
                        standardDetail: '사무실 임대 또는 PM의 의사결정에 의한 경비',
                        inputValue: null,
                        calculatedValue: null,
                        finalAmount: 0,
                    },
                ],
            },
        };

        return NextResponse.json(exportData);
    } catch (error: any) {
        console.error('Error fetching profitability export data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profitability data', message: error.message },
            { status: 500 }
        );
    }
}
