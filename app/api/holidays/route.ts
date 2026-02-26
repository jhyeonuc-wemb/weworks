import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 휴일 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');

        let sql = `
            SELECT 
                id,
                TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date,
                name,
                is_recurring,
                description,
                created_at,
                updated_at
            FROM holidays
        `;

        const params = [];
        if (year) {
            sql += ` WHERE EXTRACT(YEAR FROM holiday_date) = $1`;
            params.push(parseInt(year));
        }

        sql += ` ORDER BY holiday_date ASC`;

        const result = await query(sql, params);

        return NextResponse.json({ holidays: result.rows });
    } catch (error: any) {
        console.error('Error fetching holidays:', error);
        return NextResponse.json(
            { error: 'Failed to fetch holidays', message: error.message },
            { status: 500 }
        );
    }
}

// 신규 휴일 등록
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { holiday_date, name, is_recurring, description } = data;

        if (!holiday_date || !name) {
            return NextResponse.json({ error: 'Date and Name are required' }, { status: 400 });
        }

        const sql = `
            INSERT INTO holidays (
                holiday_date, name, is_recurring, description
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await query(sql, [
            holiday_date,
            name,
            is_recurring !== undefined ? is_recurring : false,
            description || ''
        ]);

        return NextResponse.json({ holiday: result.rows[0] });
    } catch (error: any) {
        console.error('Error creating holiday:', error);
        return NextResponse.json(
            { error: 'Failed to create holiday', message: error.message },
            { status: 500 }
        );
    }
}
