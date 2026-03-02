const fs = require('fs');
const path = require('path');

const mappings = {
    'project_code': 'projectCode',
    'customer_name': 'customerName',
    'category_name': 'categoryName',
    'field_name': 'fieldName',
    'customer_id': 'customerId',
    'orderer_id': 'ordererId',
    'orderer_name': 'ordererName',
    'manager_id': 'managerId',
    'manager_name': 'managerName',
    'sales_representative_id': 'salesRepresentativeId',
    'sales_representative_name': 'salesRepresentativeName',
    'contract_start_date': 'contractStartDate',
    'contract_end_date': 'contractEndDate',
    'actual_start_date': 'actualStartDate',
    'actual_end_date': 'actualEndDate',
    'expected_amount': 'expectedAmount',
    'process_status': 'processStatus',
    'current_phase': 'currentPhase',
    'computed_phase': 'computedPhase',
    'computed_status': 'computedStatus',
    'risk_level': 'riskLevel',
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
                callback(dirPath);
            }
        }
    });
}

const dirsToScan = [
    path.join(__dirname, '../app/(main)'),
    path.join(__dirname, '../components')
];

let filesModified = 0;

for (const dir of dirsToScan) {
    walkDir(dir, filePath => {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        for (const [snake, camel] of Object.entries(mappings)) {
            // safe replacement for word boundaries
            const regex = new RegExp(`\\b${snake}\\b`, 'g');
            content = content.replace(regex, camel);
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesModified++;
        }
    });
}

console.log('Finished mapping frontend! Files modified:', filesModified);
