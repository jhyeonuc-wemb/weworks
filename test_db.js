const { Pool } = require('pg');

const pool = new Pool({
    host: '115.21.12.186',
    port: 7432,
    database: 'weworks',
    user: 'weworks',
    password: 'weworks!1234',
});

pool.query("SELECT * FROM we_users WHERE username = 'hwjeong'", (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(res.rows, null, 2));
    }
    pool.end();
});
