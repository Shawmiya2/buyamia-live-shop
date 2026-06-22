import type { Metadata } from "next";
import { RiskPage } from "../action-pages";

export const metadata: Metadata = {
  title: "Risk review",
};

export default function Page() {
  return <RiskPage />;
}
