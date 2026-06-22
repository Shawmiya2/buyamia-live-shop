import type { Metadata } from "next";
import { SupplierDetailPage } from "../../action-pages";

export const metadata: Metadata = {
  title: "Supplier details",
};

export default async function Page(props: PageProps<"/dashboard/main/suppliers/[id]">) {
  const { id } = await props.params;
  return <SupplierDetailPage id={id} />;
}
