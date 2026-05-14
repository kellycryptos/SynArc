"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  showIcon?: boolean;
  glowOnHover?: boolean;
  underline?: boolean;
  onClick?: () => void;
}

export function AnimatedLink({
  href,
  children,
  className,
  external = false,
  showIcon = false,
  glowOnHover = true,
  underline = true,
  onClick,
}: AnimatedLinkProps) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  const baseClasses = cn(
    "group inline-flex items-center gap-1.5 text-sm transition-colors duration-300",
    "text-text-secondary hover:text-text-primary",
    glowOnHover && "hover:text-glow-purple",
    underline && "link-underline",
    className
  );

  const content = (
    <>
      <span>{children}</span>
      {showIcon && external && (
        <ExternalLink className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-60 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
      )}
    </>
  );

  if (external) {
    return (
      <motion.a
        href={href}
        className={baseClasses}
        {...linkProps}
        onClick={onClick}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
      <Link href={href} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    </motion.div>
  );
}
