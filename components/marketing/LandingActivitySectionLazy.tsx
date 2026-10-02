"use client";

/**
 * LandingActivitySectionLazy
 *
 * Thin Client Component boundary so that the Server Component marketing page
 * can import a component that uses next/dynamic with ssr:false — which is
 * forbidden directly inside Server Components.
 */

import dynamic from "next/dynamic";

const LandingActivitySection = dynamic(
  () =>
    import("./LandingActivitySection").then((m) => m.LandingActivitySection),
  { ssr: false, loading: () => null }
);

export function LandingActivitySectionLazy() {
  return <LandingActivitySection />;
}
