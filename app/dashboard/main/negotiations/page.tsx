import type { Metadata } from "next";
import { NegotiationsPage } from "../action-pages";

export const metadata: Metadata = {
  title: "Negotiations",
};

export default function Page() {
  return <NegotiationsPage />;
}
