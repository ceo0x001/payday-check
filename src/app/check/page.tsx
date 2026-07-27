import type { Metadata } from "next";
import { CheckFlow } from "@/components/flow/check-flow";

export const metadata: Metadata = {
  title: "Your Payday Check",
  // The flow is personal and stateful; there's nothing here worth indexing.
  robots: { index: false, follow: false },
};

export default function CheckPage() {
  return <CheckFlow />;
}
