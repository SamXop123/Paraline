import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theme Gallery",
  description: "Explore studio-grade edge visualizer themes for Paraline. From ambient drifts to energetic waves, customize your desktop audio visualization experience.",
};

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
