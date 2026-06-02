import { MarketingNavbar } from "@/components/navbar/MarketingNavbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      <main className="flex-grow pt-20">
        <PageWrapper>
          {children}
        </PageWrapper>
      </main>
      <Footer />
    </>
  );
}
