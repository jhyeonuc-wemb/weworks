const fs = require('fs');
const path = require('path');

const filePath = 'd:\\WeMB\\02.Project\\weworks\\app\\(main)\\projects\\[id]\\settlement\\page.tsx';

try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Handle CRLF or LF
    let lines = content.split(/\r?\n/);

    console.log('Total lines:', lines.length);

    // Check content at 923 (Line 924)
    console.log('Line 924:', lines[923]);
    if (!lines[923].trim().startsWith('{(() => {')) {
        console.error('Line 924 mismatch');
        process.exit(1);
    }

    // Check content at 989 (Line 990)
    console.log('Line 990:', lines[989]);
    if (!lines[989].trim().startsWith('return (')) {
        console.error('Line 990 mismatch');
        process.exit(1);
    }

    // Check content at 1734 (Line 1735)
    console.log('Line 1735:', lines[1734]);
    if (!lines[1734].trim().startsWith(');')) {
        console.error('Line 1735 mismatch');
        process.exit(1);
    }
    // Check content at 1735 (Line 1736)
    console.log('Line 1736:', lines[1735]);
    if (!lines[1735].trim().startsWith('})()}')) {
        console.error('Line 1736 mismatch');
        process.exit(1);
    }

    // Delete from bottom
    // Remove 1734, 1735 (2 lines)
    lines.splice(1734, 2);

    // Remove 923 to 989 (67 lines)
    lines.splice(923, 67);

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully modified file');

} catch (err) {
    console.error(err);
    process.exit(1);
}
