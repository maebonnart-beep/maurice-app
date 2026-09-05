import { MarketplaceHeader } from "@/components/ui/MarketplaceHeader";

export default function SecondeMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketplaceHeader />
      {children}
    </>
  );
}
