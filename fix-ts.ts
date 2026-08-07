import fs from 'fs';
import path from 'path';

function replaceAllInFile(filePath: string, search: RegExp | string, replace: string) {
  const fullPath = path.resolve(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(fullPath, content);
}

const apiRoutes3 = [
  'src/app/api/departments/route.ts',
  'src/app/api/designations/route.ts',
  'src/app/api/skills/route.ts',
  'src/app/api/leave-types/route.ts',
  'src/app/api/leave-balances/route.ts',
  'src/app/api/leave-requests/route.ts',
  'src/app/api/payroll/route.ts',
  'src/app/api/performance-reviews/route.ts',
  'src/app/api/employees/route.ts'
];

const apiRoutes4 = [
  'src/app/api/employees/[id]/route.ts'
];

const apiRoutes5 = [
  'src/app/api/leave-requests/[id]/decision/route.ts',
  'src/app/api/employees/[id]/skills/route.ts'
];

for (const route of apiRoutes3) {
  replaceAllInFile(route, "'../../../../server/", "'../../../server/");
}

for (const route of apiRoutes4) {
  replaceAllInFile(route, "'../../../../../server/", "'../../../../server/");
}

for (const route of apiRoutes5) {
  replaceAllInFile(route, "'../../../../../../server/", "'../../../../../server/");
}

// Fix code-generator.ts
let codeGen = fs.readFileSync('src/server/lib/code-generator.ts', 'utf8');
codeGen = codeGen.replace("const latestCode = latestEmployee[0].code;", "const latestCode = latestEmployee[0]?.code || '';");
fs.writeFileSync('src/server/lib/code-generator.ts', codeGen);

// Fix leave.service.ts
let leaveSvc = fs.readFileSync('src/server/services/leave.service.ts', 'utf8');
leaveSvc = leaveSvc.replace("const currentYear = new Date(request.startDate).getFullYear();", "const currentYear = new Date(request!.startDate).getFullYear();");
leaveSvc = leaveSvc.replace("eq(leaveBalances.employeeId, request.employeeId),", "eq(leaveBalances.employeeId, request!.employeeId),");
leaveSvc = leaveSvc.replace("eq(leaveBalances.leaveTypeId, request.leaveTypeId),", "eq(leaveBalances.leaveTypeId, request!.leaveTypeId),");
leaveSvc = leaveSvc.replace("parseFloat(request.days)", "parseFloat(request!.days)");
fs.writeFileSync('src/server/services/leave.service.ts', leaveSvc);

// Fix test script
let testContent = fs.readFileSync('test-create-employee.ts', 'utf8');
testContent = testContent.replace(/desigs\[0\]\.id/g, "desigs[0]!.id");
fs.writeFileSync('test-create-employee.ts', testContent);

// Fix crypto.ts
let cryptoContent = fs.readFileSync('src/server/lib/crypto.ts', 'utf8');
cryptoContent = cryptoContent.replace("Buffer.from(ENCRYPTION_KEY, 'hex')", "Buffer.from(ENCRYPTION_KEY as string, 'hex')");
fs.writeFileSync('src/server/lib/crypto.ts', cryptoContent);

console.log('Fixed imports and TS errors');
