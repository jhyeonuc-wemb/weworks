const http = require('http');
const fs = require('fs');

// First do login to get fresh session
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
            path: path + ';jsessionid=' + session,
            method: 'GET',
            headers: { 'Cookie': 'JSESSIONID=' + session }
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

    // Get main page to find menus
    const main = await fetchPage('/main.do', session);
    fs.writeFileSync('d:/workspace/weworks/wims_main.html', main.body, 'utf8');
    console.log('Main page saved, size:', main.body.length);

    // Try common work log URLs
    const urlsToTry = [
        '/wlog/wlogList.do',
        '/worklog/list.do',
        '/work/workLogList.do',
        '/employee/workLog.do',
        '/workreport/list.do',
        '/dailywork/list.do',
        '/mywork/list.do',
        '/schedule/list.do',
        '/timesheet/list.do',
        '/attendance/list.do',
    ];

    for (const url of urlsToTry) {
        const r = await fetchPage(url, session);
        const isError = r.body.includes('<title>ERROR</title>');
        const title = (r.body.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
        console.log(url, '-> status:', r.status, 'error:', isError, 'title:', title);
    }
}

run().catch(console.error);
