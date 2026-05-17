import { MarketingNavbar } from "@/components/navbar/MarketingNavbar";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
