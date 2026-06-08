import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Requirements",
  description: "Check the minimum and recommended system hardware requirements for running Paraline Desktop Audio Visualizer on Windows 10 and 11.",
};

export default function RequirementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
