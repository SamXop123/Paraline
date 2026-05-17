const footerLinks = [
  { label: "Contact", href: "mailto:hello@paraline.app" },
  { label: "Terms", href: "#terms" },
  { label: "Privacy", href: "#privacy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
          © {new Date().getFullYear()} Paraline
        </p>

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.28em] text-white/52 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
