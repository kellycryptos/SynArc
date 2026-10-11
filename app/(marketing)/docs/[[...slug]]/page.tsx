import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { docsNav, slugMap, normalizeSlug } from '@/lib/docs-config';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  const slugKeys = Object.keys(slugMap).filter((s) => s !== "");
  return [
    { slug: [] }, // catches /docs with no slug segment (Next.js optional catch-all convention)
    ...slugKeys.map((s) => ({ slug: [s] })),
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugArr = resolvedParams.slug || [];
  const currentSlug = normalizeSlug(slugArr.join('/'));
  const navItem = docsNav.find((item) => item.slug === currentSlug);
  const title = navItem ? `${navItem.label} — Documentation | Syn DAO` : 'Documentation | Syn DAO';

  return {
    title,
    description: 'Documentation for Syn DAO — the on-chain funding, treasury, and governance rails on Arc.',
  };
}

// In-memory cache of all documentation markdown files
let cachedDocs: Record<string, string> | null = null;

function getAllDocs(): Record<string, string> {
  if (cachedDocs) return cachedDocs;
  const docs: Record<string, string> = {};
  for (const [slug, fileName] of Object.entries(slugMap)) {
    try {
      const filePath = path.join(process.cwd(), 'docs', fileName);
      if (fs.existsSync(filePath)) {
        docs[slug] = fs.readFileSync(filePath, 'utf8');
      }
    } catch (err) {
      console.error(`Failed to read markdown file for ${slug} (${fileName}):`, err);
    }
  }
  cachedDocs = docs;
  return docs;
}

export default async function DocsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugArr = resolvedParams.slug || [];
  const currentSlug = slugArr.join('/');

  if (!(currentSlug in slugMap)) {
    notFound();
  }

  const allDocs = getAllDocs();

  return (
    <DocsViewer
      initialSlug={currentSlug}
      allDocs={allDocs}
      docsNav={docsNav}
      slugMap={slugMap}
    />
  );
}
