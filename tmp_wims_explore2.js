const http = require('http');
const fs = require('fs');

function doLogin() {
    return new Promise((resolve) => {
        const postData = 'j_username=hwjeong&j_password=mr20141001%40&userSe=GNR';
        const options = {
            hostname: 'wims.wemb.co.kr',
            path: '/j_spring_security_check',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = http.request(options, (res) => {
            const setCookie = res.headers['set-cookie'];
            let session = '';
            if (setCookie) {
                const match = setCookie.join(';').match(/JSESSIONID=([^;]+)/);
                if (match) session = match[1];
            }
            resolve(session);
        });
        req.on('error', (e) => resolve(''));
        req.write(postData);
        req.end();
    });
}

function fetchPage(path, session) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'wims.wemb.co.kr',
            path: path + (path.includes('?') ? '&' : '?') + '_sid=' + session,
            method: 'GET',
            headers: {
                'Cookie': 'JSESSIONID=' + session,
                'Referer': 'http://wims.wemb.co.kr/main.do;jsessionid=' + session
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }));
        });
        req.on('error', (e) => resolve({ error: e.message, body: '' }));
        req.end();
    });
}

async function run() {
    console.log('Logging in...');
    const session = await doLogin();
    console.log('Session:', session);

    const pages = [
        '/job/getJobSchedule.do',
        '/job/getTeamWork.do',
        'wims/cs/getJobReport.do',
        'wims/stat/UserYearStatus.do',
        'wims/mypage/MyPageMain.do',
    ];

    for (const p of pages) {
        const r = await fetchPage('/' + p.replace(/^\//, ''), session);
        const isError = r.body.includes('<title>ERROR</title>') || r.body.includes('errormessage');
        const title = (r.body.match(/<title>([^<]+)<\/title>/) || [])[1] || 'NO TITLE';
        console.log('\n=== ' + p + ' ===');
        console.log('Status:', r.status, '| Error:', isError, '| Title:', title);
        if (!isError && r.body.length > 100) {
            fs.writeFileSync('d:/workspace/weworks/wims_page_' + p.replace(/[\/\.]/g, '_') + '.html', r.body, 'utf8');
            console.log('Saved file. Size:', r.body.length);
            // Print first 1500 chars
            console.log('Preview:', r.body.substring(0, 1500).replace(/\s+/g, ' '));
        }
    }
}

run().catch(console.error);
