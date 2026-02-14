const { query } = require('./lib/db');

async function main() {
    try {
        const user = (await query(`SELECT * FROM we_users WHERE username = 'hwjeong'`)).rows[0];
        console.log('User:', user);

        if (user && user.rank_id) {
            const rank = (await query(`SELECT * FROM we_ranks WHERE id = $1`, [user.rank_id])).rows[0];
            console.log('Rank:', rank);
        }
    } catch (e) {
        console.error(e);
    }
}

main();
