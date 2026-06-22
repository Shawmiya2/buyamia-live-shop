import type { Metadata } from "next";
import { RfqCreatePage } from "../../action-pages";

export const metadata: Metadata = {
  title: "Generate RFQ",
};

export default function Page() {
  return <RfqCreatePage />;
}
