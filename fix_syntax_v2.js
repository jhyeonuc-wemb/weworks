const fs = require('fs');

const filePath = 'd:\\WeMB\\02.Project\\weworks\\app\\(main)\\projects\\[id]\\settlement\\page.tsx';

try {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split(/\r?\n/);

    console.log('Total lines:', lines.length);

    // function to find line index
    function findIndex(search, start = 0) {
        for (let i = start; i < lines.length; i++) {
            if (lines[i].includes(search)) return i;
        }
        return -1;
    }

    const startIdx = findIndex('{(() => {', 800);
    const returnIdx = findIndex('return (', startIdx);
    const endParenIdx = findIndex(');', 1700);
    const endIIFEIdx = findIndex('})()}', endParenIdx);

    console.log('Start:', startIdx, lines[startIdx]);
    console.log('Return:', returnIdx, lines[returnIdx]);
    console.log('EndParen:', endParenIdx, lines[endParenIdx]);
    console.log('EndIIFE:', endIIFEIdx, lines[endIIFEIdx]);

    if (startIdx === -1 || returnIdx === -1 || endParenIdx === -1 || endIIFEIdx === -1) {
        console.error('Could not find all markers');
        process.exit(1);
    }

    // Delete bottom up
    // Delete End (EndParenIdx and EndIIFEIdx)
    // Check if they are contiguous
    if (endIIFEIdx === endParenIdx + 1) {
        lines.splice(endParenIdx, 2);
    } else {
        console.error('End lines not contiguous');
        process.exit(1);
    }

    // Delete Start (From StartIdx to ReturnIdx inclusive)
    // Actually, we want to Keep the content inside the return statement?
    // No, we want to remove the IIFE envelope.
    // The content starts AFTER 'return ('.
    // Line (returnIdx) is '        return ('.
    // Line (returnIdx+1) is '          <div ...'.
    // So we delete from startIdx to returnIdx INCLUSIVE.

    lines.splice(startIdx, returnIdx - startIdx + 1);

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully modified file');

} catch (err) {
    console.error(err);
    process.exit(1);
}
