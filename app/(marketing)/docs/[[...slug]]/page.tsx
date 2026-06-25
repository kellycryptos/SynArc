import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { parseMarkdown } from '@/lib/markdown';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

const slugMap: Record<string, string> = {
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
  "technical-reference": "07b-technical-reference.md",
  "roadmap": "08-roadmap.md",
  "faq": "09-faq.md"
};

const docsNav = [
  { label: "Overview", slug: "" },
  { label: "Governance", slug: "governance" },
  { label: "Treasury", slug: "treasury" },
  { label: "Creator DAO", slug: "creator-economy" },
  { label: "AI Agents", slug: "ai-agents" },
  { label: "Agent SDK", slug: "sdk" },
  { label: "DAO Registry", slug: "dao-registry" },
  { label: "Bridge", slug: "bridge" },
  { label: "Smart Contracts", slug: "smart-contracts" },
  { label: "Technical Reference", slug: "technical-reference" },
  { label: "Mainnet Roadmap", slug: "roadmap" },
  { label: "FAQ", slug: "faq" },
];

export default async function DocsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugArr = resolvedParams.slug || [];
  const currentSlug = slugArr.join('/');
  
  if (!(currentSlug in slugMap)) {
    notFound();
  }
  
  const fileName = slugMap[currentSlug];
  const filePath = path.join(process.cwd(), 'docs', fileName);
  
  let markdown = '';
  try {
    markdown = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Failed to read markdown file: ${filePath}`, err);
    notFound();
  }
  
  const content = parseMarkdown(markdown);
  
  // Find current index for Prev/Next navigation
  const navSlug = currentSlug === 'overview' ? '' : currentSlug;
  const currentIndex = docsNav.findIndex(item => item.slug === navSlug);
  const prevItem = currentIndex > 0 ? docsNav[currentIndex - 1] : null;
  const nextItem = currentIndex < docsNav.length - 1 ? docsNav[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28 space-y-6 bg-card/20 border border-card-border/40 rounded-2xl p-5 glass-card backdrop-blur-md">
          <div className="flex items-center gap-2 text-foreground font-extrabold text-sm tracking-wide uppercase select-none border-b border-border-thin pb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Documentation</span>
          </div>
          <nav className="flex flex-col gap-1.5">
            {docsNav.map((item) => {
              const active = item.slug === currentSlug || (item.slug === "" && currentSlug === "overview");
              return (
                <Link
                  key={item.slug}
                  href={`/docs/${item.slug}`}
                  className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-primary/20 text-primary border-l-2 border-primary'
                      : 'text-muted hover:text-foreground hover:bg-white/[0.03]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <article className="flex-1 w-full max-w-3xl min-h-[50vh] bg-card/10 border border-card-border/30 rounded-2xl p-6 sm:p-10 glass-card backdrop-blur-md relative overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-arc-blue/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 prose prose-invert max-w-none">
            {content}
          </div>

          {/* Prev/Next Page Navigation */}
          <div className="flex justify-between items-center border-t border-border-thin mt-12 pt-6 gap-4">
            {prevItem ? (
              <Link
                href={`/docs/${prevItem.slug}`}
                className="flex items-center gap-2 group px-4 py-2.5 rounded-xl border border-card-border hover:border-primary/40 hover:bg-white/[0.02] text-xs font-bold text-muted hover:text-foreground transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-text-tertiary">Previous</div>
                  <div>{prevItem.label}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextItem ? (
              <Link
                href={`/docs/${nextItem.slug}`}
                className="flex items-center gap-2 group px-4 py-2.5 rounded-xl border border-card-border hover:border-primary/40 hover:bg-white/[0.02] text-xs font-bold text-muted hover:text-foreground transition-all duration-300"
              >
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-text-tertiary">Next</div>
                  <div>{nextItem.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </article>

      </div>
    </div>
  );
}
