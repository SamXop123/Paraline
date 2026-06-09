"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { GITHUB_URL } from "@/lib/paraline-api";

const GithubIcon = ({ className, strokeWidth = 2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("✅ Message submitted successfully!");

        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
        });

        setTimeout(() => {
          setStatus("");
        }, 4000);
      } else {
        setStatus(`❌ ${data.error || "Failed to submit message."}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-12 bg-[#060913] relative overflow-hidden z-0">
      {/* Immersive background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#060913] to-[#060913] -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold tracking-[0.2em] text-muted hover:text-white hover:bg-white/[0.06] hover:border-white/20 uppercase transition-all duration-300 mb-16 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-left mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/[0.05] border border-cyan-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">Support Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            Contact Us
          </h1>
          <p className="text-lg text-muted max-w-xl font-light tracking-wide">
            Need help with Paraline? Reach out to us for support, feedback, bug reports, or feature requests.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.3 }}
            className="lg:col-span-7 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_10px_20px_rgba(0,0,0,0.3)] hover:bg-white/[0.03] transition-all duration-500"
          >
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              Send a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-white/45 mb-2.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-2xl bg-[#010206]/40 border border-white/5 text-white outline-none focus:border-cyan-500/40 focus:bg-[#010206]/60 transition-all placeholder:text-white/25 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-white/45 mb-2.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full p-4 rounded-2xl bg-[#010206]/40 border border-white/5 text-white outline-none focus:border-cyan-500/40 focus:bg-[#010206]/60 transition-all placeholder:text-white/25 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-white/45 mb-2.5">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-[#010206]/40 border border-white/5 text-white outline-none focus:border-cyan-500/40 focus:bg-[#010206]/60 transition-all placeholder:text-white/25 text-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-[0.15em] text-white/45 mb-2.5">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-2xl bg-[#010206]/40 border border-white/5 text-white outline-none focus:border-cyan-500/40 focus:bg-[#010206]/60 transition-all placeholder:text-white/25 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)] font-bold tracking-widest text-xs uppercase transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              {status && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-4 p-4 rounded-xl border flex items-center gap-3 text-sm ${
                    status.includes("✅")
                      ? "bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/[0.05] border-red-500/20 text-red-400"
                  }`}
                >
                  {status.includes("✅") ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{status.replace("✅", "").replace("❌", "").trim()}</span>
                </div>
              )}
            </form>
          </motion.div>

          {/* Right Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Email Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[24px] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-start gap-4 hover:border-cyan-500/20 hover:bg-white/[0.03] transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-[16px] bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 group-hover:scale-105 transition-transform duration-300">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white mb-1">Direct Support</h3>
                <a href="mailto:support@paraline.app" className="text-sm text-cyan-400 hover:underline">
                  support@paraline.app
                </a>
                <p className="text-xs text-muted/60 mt-2 font-light leading-relaxed">
                  Send us an email directly if you prefer not to use the contact form.
                </p>
              </div>
            </motion.div>

            {/* GitHub Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[24px] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-start gap-4 hover:border-purple-500/20 hover:bg-white/[0.03] transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-[16px] bg-purple-500/10 flex items-center justify-center border border-purple-500/30 group-hover:scale-105 transition-transform duration-300">
                <GithubIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white mb-1">GitHub Issues</h3>
                <a 
                  href={GITHUB_URL + "/issues"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-purple-400 hover:underline"
                >
                  Submit a bug report
                </a>
                <p className="text-xs text-muted/60 mt-2 font-light leading-relaxed">
                  Have a technical bug or want to request a feature? Create an issue directly in the repository.
                </p>
              </div>
            </motion.div>

            {/* Response Time Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[24px] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-start gap-4 hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-[16px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-white mb-1">Typical Response Time</h3>
                <p className="text-sm text-emerald-300 font-medium">Within 24–48 Hours</p>
                <p className="text-xs text-muted/60 mt-2 font-light leading-relaxed">
                  We review submissions regularly. We appreciate your patience while we investigate your inquiries.
                </p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </main>
  );
}