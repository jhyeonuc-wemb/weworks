
const { Client } = require('pg');

const client = new Client({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. 기존에 임시로 만든 테이블 삭제
        await client.query(`DROP TABLE IF EXISTS project_phase_statuses`);
        console.log('Dropped temporary table project_phase_statuses');

        // 2. 최상위 카테고리 코드 생성 ('PHASE_STATUS': 프로젝트 단계별 상태)
        // 먼저 we_codes 테이블이 있는지 확인 (혹시 모르니)
        const checkTable = `
            CREATE TABLE IF NOT EXISTS we_codes (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER REFERENCES we_codes(id) ON DELETE CASCADE,
                code VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(parent_id, code)
            );
        `;
        await client.query(checkTable);

        // 최상위 그룹 코드 삽입/조회 함수
        async function getOrCreateCode(parent_id, code, name, order = 0, description = '') {
            let res;
            if (parent_id) {
                res = await client.query(
                    `SELECT id FROM we_codes WHERE parent_id = $1 AND code = $2`,
                    [parent_id, code]
                );
            } else {
                res = await client.query(
                    `SELECT id FROM we_codes WHERE parent_id IS NULL AND code = $1`,
                    [code]
                );
            }

            if (res.rows.length > 0) {
                return res.rows[0].id;
            }

            const insertRes = await client.query(
                `INSERT INTO we_codes (parent_id, code, name, display_order, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [parent_id, code, name, order, description]
            );
            return insertRes.rows[0].id;
        }

        // 3. 데이터 구조 생성
        // Root: PROJECT_PHASE_STATUS
        const rootId = await getOrCreateCode(null, 'PROJECT_PHASE_STATUS', '프로젝트 단계별 진행상태', 0, '프로젝트 각 단계(M/D, VRB 등)의 진행 상태 관리');
        console.log(`Root Code 'PROJECT_PHASE_STATUS' ID: ${rootId}`);

        // Phases to migrate
        const phases = [
            { code: 'MD_ESTIMATION', name: 'M/D 산정' },
            { code: 'VRB', name: 'VRB 심의' },
            { code: 'PROFITABILITY', name: '수지분석서' },
            { code: 'SETTLEMENT', name: '수지정산서' }
        ];

        // Statuses to add for each phase
        const commonStatuses = [
            { code: 'STANDBY', name: '대기', order: 1 },
            { code: 'IN_PROGRESS', name: '작성', order: 2 },
            { code: 'COMPLETED', name: '완료', order: 3 }
        ];

        for (const phase of phases) {
            // Level 2: Phase Code (e.g., MD_ESTIMATION)
            const phaseId = await getOrCreateCode(rootId, phase.code, phase.name, 0);
            console.log(`  - Phase Code '${phase.code}' ID: ${phaseId}`);

            for (const status of commonStatuses) {
                // Level 3: Status Code (e.g., STANDBY)
                await getOrCreateCode(phaseId, status.code, status.name, status.order);
                console.log(`    - Status '${status.name}' added.`);
            }
        }

        console.log('Migration to Common Codes (we_codes) completed successfully.');

    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await client.end();
    }
}

run();
