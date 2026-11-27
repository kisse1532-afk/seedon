import type { Metadata } from "next";
import AlertSettingsForm from "./AlertSettingsForm";

export const metadata: Metadata = {
  title: "맞춤 설정",
  robots: { index: false, follow: false },
};

export default function AlertSettingsPage() {
  return <AlertSettingsForm />;
}
