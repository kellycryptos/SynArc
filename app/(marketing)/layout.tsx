import { MarketingNavbar } from "@/components/navbar/MarketingNavbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <MarketingNavbar />
      <main className="flex-grow pt-16 sm:pt-20 w-full overflow-x-hidden">
        <PageWrapper>
          <ErrorBoundary sectionName="Marketing Area">
            {children}
          </ErrorBoundary>
        </PageWrapper>
      </main>
      <Footer />
    </div>
  );
}
