import type { Metadata } from "next";
import { RfqListPage } from "../action-pages";

export const metadata: Metadata = {
  title: "RFQs",
};

export default function Page() {
  return <RfqListPage />;
}
