const { execSync } = require('child_process');

try {
  const output = execSync('npx eslint . --quiet --format json', { encoding: 'utf8' });
  parseOutput(output);
} catch (e) {
  if (e.stdout) {
    parseOutput(e.stdout);
  } else {
    console.error(e);
  }
}

function parseOutput(output) {
  const data = JSON.parse(output);
  const fixes = [];
  
  for (const file of data) {
    const errors = file.messages.filter(m => m.severity === 2 && m.ruleId === 'react-hooks/set-state-in-effect');
    if (errors.length > 0) {
      fixes.push({
        file: file.filePath,
        lines: errors.map(e => e.line)
      });
    }
  }
  
  console.log(JSON.stringify(fixes, null, 2));
}
