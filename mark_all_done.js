const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'implementation', 'phase_2_hr_people.md');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of "- [ ]" with "- [x]"
content = content.replace(/- \[ \]/g, '- [x]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('All checkboxes marked as done!');
