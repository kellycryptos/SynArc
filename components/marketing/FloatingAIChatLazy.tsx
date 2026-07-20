"use client";

import dynamic from "next/dynamic";

// This thin Client Component wrapper exists solely to allow next/dynamic with
// ssr:false inside the Server Component marketing page. next/dynamic with ssr:false
// cannot be called directly inside a Server Component (Next.js constraint), but
// it *can* be called inside a Client Component — so we isolate the dynamic()
// call here and re-export a stable component that the Server page can import.
const FloatingAIChat = dynamic(
  () => import("./FloatingAIChat").then((m) => m.FloatingAIChat),
  { ssr: false, loading: () => null }
);

export function FloatingAIChatLazy() {
  return <FloatingAIChat />;
}
