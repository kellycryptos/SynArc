const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '../artifacts/contracts/SynArcCrowdfund.sol/SynArcCrowdfund.json');
const outputPath = path.join(__dirname, '../lib/governance/SynArcCrowdfund.ts');

try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  const content = `// Auto-generated artifact for SynArcCrowdfund
export const SynArcCrowdfundABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const SynArcCrowdfundBytecode = "${artifact.bytecode}" as string;
`;
  
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log('✅ Extracted SynArcCrowdfund ABI and Bytecode successfully to:', outputPath);
} catch (err) {
  console.error('❌ Extraction failed:', err.message || err);
}
