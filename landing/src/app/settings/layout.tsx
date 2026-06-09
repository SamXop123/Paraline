import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desktop Client Configuration",
  description: "Live interactive preview of the settings, display preferences, and audio capture options available inside the Paraline Windows desktop client.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
