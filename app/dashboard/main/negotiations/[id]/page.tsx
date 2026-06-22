import type { Metadata } from "next";
import { NegotiationsPage } from "../../action-pages";

export const metadata: Metadata = {
  title: "Negotiation detail",
};

export default async function Page(props: PageProps<"/dashboard/main/negotiations/[id]">) {
  const { id } = await props.params;
  return <NegotiationsPage selectedId={id} />;
}
