import { MarketplaceHeader } from "@/components/ui/MarketplaceHeader";

export default function MonPlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketplaceHeader />
      {children}
    </>
  );
}
