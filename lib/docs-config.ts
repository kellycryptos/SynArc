export const slugMap: Record<string, string> = {
  "": "README.md",
  "overview": "README.md",
  "governance": "02-governance.md",
  "treasury": "03-treasury.md",
  "crowdfund": "03c-creator-economy.md",
  "creator-economy": "03c-creator-economy.md",
  "ai-agents": "04-ai-agents.md",
  "sdk": "04b-sdk.md",
  "dao-registry": "05-dao-registry.md",
  "bridge": "06-bridge.md",
  "smart-contracts": "07-smart-contracts.md",
  "three-way-match": "07c-three-way-match-architecture.md",
  "three-way-match-architecture": "07c-three-way-match-architecture.md",
  "technical-reference": "07b-technical-reference.md",
  "roadmap": "08-roadmap.md",
  "faq": "09-faq.md"
};

export const docsNav = [
  { label: "Overview", slug: "" },
  { label: "Governance", slug: "governance" },
  { label: "Treasury", slug: "treasury" },
  { label: "Creator DAO", slug: "creator-economy" },
  { label: "AI Agents", slug: "ai-agents" },
  { label: "Agent SDK", slug: "sdk" },
  { label: "DAO Registry", slug: "dao-registry" },
  { label: "Bridge", slug: "bridge" },
  { label: "Smart Contracts", slug: "smart-contracts" },
  { label: "Three-Way Match", slug: "three-way-match" },
  { label: "Technical Reference", slug: "technical-reference" },
  { label: "Mainnet Roadmap", slug: "roadmap" },
  { label: "FAQ", slug: "faq" },
];

export function normalizeSlug(slug: string): string {
  if (!slug || slug === 'overview') return '';
  if (slug === 'three-way-match-architecture') return 'three-way-match';
  if (slug === 'crowdfund') return 'creator-economy';
  return slug;
}
