const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
    connectionTimeoutMillis: 20000,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🚀 사업단계 통합 관리 마이그레이션 시작...\n');

        // ─────────────────────────────────────────
        // 1. project_phase_groups 테이블 생성
        // ─────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS project_phase_groups (
                id            SERIAL PRIMARY KEY,
                code          VARCHAR NOT NULL UNIQUE,
                name          VARCHAR NOT NULL,
                color         VARCHAR DEFAULT 'blue',
                display_order INT DEFAULT 0,
                is_active     BOOLEAN DEFAULT true,
                description   TEXT,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ project_phase_groups 테이블 생성');

        // 초기 4개 그룹 데이터
        await client.query(`
            INSERT INTO project_phase_groups (code, name, color, display_order) VALUES
                ('sales_ps',    '영업/PS',  'blue',    1),
                ('project',     '프로젝트', 'emerald', 2),
                ('maintenance', '유지보수', 'purple',  3),
                ('closure',     '종료',     'orange',  4)
            ON CONFLICT (code) DO NOTHING
        `);
        console.log('✔ project_phase_groups 초기 데이터 삽입 (4개 그룹)');

        // ─────────────────────────────────────────
        // 2. project_phases 에 group_id 컬럼 추가
        // ─────────────────────────────────────────
        await client.query(`
            ALTER TABLE project_phases
            ADD COLUMN IF NOT EXISTS group_id INT REFERENCES project_phase_groups(id)
        `);
        console.log('✔ project_phases.group_id 컬럼 추가');

        // 기존 phase_group → group_id 매핑
        await client.query(`
            UPDATE project_phases p
            SET group_id = g.id
            FROM project_phase_groups g
            WHERE p.phase_group = g.code
              AND p.group_id IS NULL
        `);
        console.log('✔ project_phases.group_id 데이터 매핑 완료');

        // ─────────────────────────────────────────
        // 3. project_phase_statuses 테이블 생성
        // ─────────────────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS project_phase_statuses (
                id            SERIAL PRIMARY KEY,
                phase_id      INT NOT NULL REFERENCES project_phases(id) ON DELETE RESTRICT,
                code          VARCHAR NOT NULL,
                name          VARCHAR NOT NULL,
                color         VARCHAR DEFAULT 'gray',
                display_order INT DEFAULT 0,
                is_active     BOOLEAN DEFAULT true,
                description   TEXT,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(phase_id, code)
            )
        `);
        console.log('✔ project_phase_statuses 테이블 생성');

        // 모든 단계에 기본 3개 상태 삽입
        await client.query(`
            INSERT INTO project_phase_statuses (phase_id, code, name, color, display_order)
            SELECT p.id, s.code, s.name, s.color, s.ord
            FROM project_phases p
            CROSS JOIN (VALUES
                ('STANDBY',     '대기',   'gray',    1),
                ('IN_PROGRESS', '진행중', 'blue',    2),
                ('COMPLETED',   '완료',   'emerald', 3)
            ) AS s(code, name, color, ord)
            ON CONFLICT (phase_id, code) DO NOTHING
        `);
        console.log('✔ project_phase_statuses 기본 데이터 삽입 (단계수 × 3개 상태)');

        // ─────────────────────────────────────────
        // 4. we_project_phase_progress 개선
        //    phase_code(text) → phase_id(int FK)
        //    status(text) → status_id(int FK)
        // ─────────────────────────────────────────
        await client.query(`
            ALTER TABLE we_project_phase_progress
            ADD COLUMN IF NOT EXISTS phase_id  INT REFERENCES project_phases(id) ON DELETE RESTRICT,
            ADD COLUMN IF NOT EXISTS status_id INT REFERENCES project_phase_statuses(id) ON DELETE RESTRICT
        `);
        console.log('✔ we_project_phase_progress: phase_id, status_id 컬럼 추가');

        // phase_code → phase_id 매핑
        await client.query(`
            UPDATE we_project_phase_progress pp
            SET phase_id = p.id
            FROM project_phases p
            WHERE pp.phase_code = p.code
              AND pp.phase_id IS NULL
        `);
        console.log('✔ we_project_phase_progress.phase_id 데이터 매핑');

        // status + phase_id → status_id 매핑
        await client.query(`
            UPDATE we_project_phase_progress pp
            SET status_id = ps.id
            FROM project_phase_statuses ps
            WHERE pp.phase_id = ps.phase_id
              AND pp.status = ps.code
              AND pp.status_id IS NULL
        `);
        console.log('✔ we_project_phase_progress.status_id 데이터 매핑');

        await client.query('COMMIT');
        console.log('\n✅ 마이그레이션 완료!');

        // 결과 검증
        const verifyPhaseGroups = await client.query(
            'SELECT count(*) FROM project_phase_groups'
        );
        const verifyStatuses = await client.query(
            'SELECT count(*) FROM project_phase_statuses'
        );
        const verifyProgress = await client.query(
            'SELECT COUNT(*) total, COUNT(phase_id) mapped_phase, COUNT(status_id) mapped_status FROM we_project_phase_progress'
        );
        console.log(`\n📊 결과:`);
        console.log(`   - project_phase_groups: ${verifyPhaseGroups.rows[0].count}개 그룹`);
        console.log(`   - project_phase_statuses: ${verifyStatuses.rows[0].count}개 상태`);
        console.log(`   - we_project_phase_progress: 전체 ${verifyProgress.rows[0].total}행, phase_id 매핑 ${verifyProgress.rows[0].mapped_phase}행, status_id 매핑 ${verifyProgress.rows[0].mapped_status}행`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ 마이그레이션 실패 (rollback):', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
