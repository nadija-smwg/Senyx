const fs = require('fs');
const path = require('path');

// Fix route files
const routeFiles = [
  'src/app/api/accounts/route.ts',
  'src/app/api/accounts/[id]/route.ts',
  'src/app/api/contacts/route.ts',
  'src/app/api/interactions/route.ts',
  'src/app/api/activities/route.ts',
  'src/app/api/deals/route.ts',
  'src/app/api/deals/[id]/route.ts',
  'src/app/api/deals/[id]/stage/route.ts',
  'src/app/api/deals/[id]/close/route.ts',
  'src/app/api/quotes/route.ts',
];

for (const file of routeFiles) {
  const filepath = path.join(process.cwd(), file);
  if (!fs.existsSync(filepath)) continue;
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix imports
  content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/server/g, '@/server');
  content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/server/g, '@/server');

  // Fix params type for Next.js 15 (params: Promise<{ id: string }>)
  content = content.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g, 
    '{ params }: { params: Promise<{ id: string }> }'
  );

  // Replace params.id with (await params).id
  content = content.replace(/params\.id/g, '(await params).id');

  fs.writeFileSync(filepath, content);
}

// Fix deal.service.ts
const dealServicePath = path.join(process.cwd(), 'src/server/services/deal.service.ts');
let dealContent = fs.readFileSync(dealServicePath, 'utf8');

// Fix Date mapping for date fields
dealContent = dealContent.replace(/expectedCloseDate: input\.expectedCloseDate \? new Date\(input\.expectedCloseDate\) : null/g, 'expectedCloseDate: input.expectedCloseDate || null');
dealContent = dealContent.replace(/validUntil: input\.validUntil \? new Date\(input\.validUntil\) : null/g, 'validUntil: input.validUntil || null');

// Fix undefined object warning
dealContent = dealContent.replace(/const lastActivity = deal\.lastActivityAt \|\| deal\.createdAt;/g, 'const lastActivity = deal.lastActivityAt || deal.createdAt;');
dealContent = dealContent.replace(/const daysSinceLastActivity = Math\.floor\(\(now\.getTime\(\) - lastActivity\.getTime\(\)\) \/ \(1000 \* 3600 \* 24\)\);/g, 'const daysSinceLastActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24)) : 0;');

// currentDeal undefined
dealContent = dealContent.replace(/if \(currentDeal\.stage === newStage\)/g, 'if (currentDeal?.stage === newStage)');
dealContent = dealContent.replace(/fromStage: currentDeal\.stage/g, 'fromStage: currentDeal?.stage || \'\'');
dealContent = dealContent.replace(/if \(currentDeal\.stage !== newStage\)/g, 'if (currentDeal?.stage !== newStage)');

fs.writeFileSync(dealServicePath, dealContent);
console.log('Fixed TypeScript errors');
