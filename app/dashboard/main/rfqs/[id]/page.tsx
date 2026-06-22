import type { Metadata } from "next";
import { RfqDetailPage } from "../../action-pages";

export const metadata: Metadata = {
  title: "RFQ details",
};

export default async function Page(props: PageProps<"/dashboard/main/rfqs/[id]">) {
  const { id } = await props.params;
  return <RfqDetailPage id={id} />;
}
