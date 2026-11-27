import type { Metadata } from "next";
import MyOpportunities from "./MyOpportunities";

export const metadata: Metadata = {
  title: "나에게 맞는 기회",
  robots: { index: false, follow: false },
};

export default function AlertsPage() {
  return <MyOpportunities />;
}
