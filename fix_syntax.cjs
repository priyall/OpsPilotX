const fs = require('fs');

const fixFile = (path) => {
    let content = fs.readFileSync(path, 'utf8');
    let oldContent = content;
    // Replace \` with `
    content = content.replace(/\\`/g, '`');
    // Also check if there's any \${
    content = content.replace(/\\\$/g, '$');
    
    if (content !== oldContent) {
        fs.writeFileSync(path, content);
        console.log(`Fixed syntax in ${path}`);
    } else {
        console.log(`No fixes needed in ${path}`);
    }
}

fixFile('src/components/ServiceNowTab.tsx');
fixFile('src/components/GeneosAlertsGrid.tsx');
