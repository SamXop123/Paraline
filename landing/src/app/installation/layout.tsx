import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installation Guide",
  description: "Get Paraline up and running on your Windows PC. Follow our simple step-by-step setup guide to start visualizing your audio in real-time.",
};

export default function InstallationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
