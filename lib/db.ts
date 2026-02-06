import { Pool } from 'pg';

// 데이터베이스 연결 풀 생성
const pool = new Pool({
  host: process.env.DB_HOST || '115.21.12.186',
  port: parseInt(process.env.DB_PORT || '7432'),
  database: process.env.DB_NAME || 'weworks',
  user: process.env.DB_USER || 'weworks',
  password: process.env.DB_PASSWORD || 'weworks!1234',
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000, // 원격 서버이므로 타임아웃 증가
});

// 연결 테스트
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

// 쿼리 헬퍼 함수
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}
