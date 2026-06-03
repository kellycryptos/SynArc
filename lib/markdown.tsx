import React from 'react';
import Link from 'next/link';

export function parseMarkdown(markdown: string): React.ReactNode[] {
  // Simple markdown parser
  // Handles:
  // - Frontmatter (skipped)
  // - Headers (# , ## , ### )
  // - Paragraphs
  // - Code blocks (```code```)
  // - Inline code (`code`)
  // - Lists (*, -, 1., 2.)
  // - Bold (**text**)
  // - Horizontal rules (***)
  
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inFrontmatter = false;
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLanguage = '';
  
  let listItems: { text: string; number?: number }[] = [];
  let listType: 'bullet' | 'ordered' | null = null;
  
  let key = 0;
  
  const flushList = () => {
    if (listType === null) return;
    
    if (listType === 'bullet') {
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc pl-5 text-sm text-text-secondary/90 my-4 space-y-2 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`}>{parseInline(item.text)}</li>
          ))}
        </ul>
      );
    } else if (listType === 'ordered') {
      elements.push(
        <ol key={`ol-${key++}`} className="list-decimal pl-5 text-sm text-text-secondary/90 my-4 space-y-2 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} value={item.number}>{parseInline(item.text)}</li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Frontmatter check
    if (line.trim() === '---') {
      if (i === 0 || inFrontmatter) {
        inFrontmatter = !inFrontmatter;
        continue;
      }
    }
    
    if (inFrontmatter) {
      continue;
    }
    
    // Code block check
    if (line.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${key++}`} className="p-4 rounded-xl bg-surface-elevated border border-border-thin font-mono text-xs text-pink-400 overflow-x-auto my-4 max-w-full shadow-inner">
            <code>
              {codeContent.join('\n')}
            </code>
          </pre>
        );
        codeContent = [];
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }
    
    const trimmed = line.trim();
    if (trimmed === '') {
      flushList();
      continue;
    }
    
    // Horizontal rule check
    if (trimmed === '***' || trimmed === '---' || trimmed === '___') {
      flushList();
      elements.push(<hr key={`hr-${key++}`} className="border-border-thin my-6 opacity-30" />);
      continue;
    }
    
    // Headers
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={`h1-${key++}`} className="text-3xl font-extrabold text-foreground tracking-tight mt-8 mb-4 font-heading">{parseInline(trimmed.slice(2))}</h1>);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={`h2-${key++}`} className="text-xl font-bold text-foreground tracking-tight mt-10 mb-4 border-b border-border-thin pb-2 font-heading">{parseInline(trimmed.slice(3))}</h2>);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={`h3-${key++}`} className="text-base font-bold text-foreground tracking-tight mt-6 mb-3 font-heading">{parseInline(trimmed.slice(4))}</h3>);
      continue;
    }
    
    // Bullet lists
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (listType !== 'bullet') {
        flushList();
        listType = 'bullet';
      }
      listItems.push({ text: trimmed.slice(2) });
      continue;
    }
    
    // Numbered lists
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      listItems.push({ number: parseInt(numberMatch[1]), text: numberMatch[2] });
      continue;
    }
    
    // Default: Paragraph
    flushList();
    elements.push(
      <p key={`p-${key++}`} className="text-[14px] leading-[1.7] text-text-secondary/95 my-4 font-medium">
        {parseInline(trimmed)}
      </p>
    );
  }
  
  flushList();
  return elements;
}

function parseBoldAndCode(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = baseKey;
  
  const tokens = text.split(/(\*\*|`)/g);
  let isBold = false;
  let isCode = false;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '**') {
      isBold = !isBold;
      continue;
    }
    if (token === '`') {
      isCode = !isCode;
      continue;
    }
    
    if (isBold) {
      parts.push(<strong key={`b-${key++}`} className="font-bold text-white">{token}</strong>);
    } else if (isCode) {
      parts.push(<code key={`c-${key++}`} className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-border-thin text-pink-400">{token}</code>);
    } else {
      parts.push(token);
    }
  }
  
  return parts;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Match markdown links: [link text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const beforeText = text.substring(lastIndex, match.index);
    if (beforeText) {
      parts.push(...parseBoldAndCode(beforeText, key));
      key += beforeText.length;
    }

    const linkText = match[1];
    const linkUrl = match[2];
    
    const isExternal = linkUrl.startsWith('http') || linkUrl.startsWith('//');
    if (isExternal) {
      parts.push(
        <a 
          key={`link-${key++}`} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline hover:text-primary/80 transition-all font-semibold"
        >
          {linkText}
        </a>
      );
    } else {
      parts.push(
        <Link 
          key={`link-${key++}`} 
          href={linkUrl} 
          className="text-primary hover:underline hover:text-primary/80 transition-all font-semibold"
        >
          {linkText}
        </Link>
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    parts.push(...parseBoldAndCode(remainingText, key));
  }

  return parts;
}
