import { ThemeShowcase } from "@/components/ThemeShowcase";

export default function ThemesPage() {
  return (
    <div className="flex min-h-screen flex-col pt-12">
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-white/[0.015] blur-[120px]" />
      
      <div className="relative z-10 w-full py-12">
        <div className="mb-12 px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Theme Gallery</h1>
          <p className="mt-3 text-muted">Browse and apply studio-grade edge visualizer themes.</p>
        </div>
        
        {/* We can reuse the showcase component here, but wrapper gives it context */}
        <div className="w-full">
          <ThemeShowcase />
        </div>
      </div>
    </div>
  );
}
