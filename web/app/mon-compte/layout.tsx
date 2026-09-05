import { MarketplaceHeader } from "@/components/ui/MarketplaceHeader";

export default function MonCompteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketplaceHeader />
      {children}
    </>
  );
}
