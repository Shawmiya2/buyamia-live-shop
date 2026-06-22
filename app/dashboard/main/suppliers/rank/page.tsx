import type { Metadata } from "next";
import { SupplierRankPage } from "../../action-pages";

export const metadata: Metadata = {
  title: "Rank suppliers",
};

export default function Page() {
  return <SupplierRankPage />;
}
