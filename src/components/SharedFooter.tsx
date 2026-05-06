"use client";
import { useState } from "react";

const TOOLS = [
  { name: "Kwizzo",        url: "https://kwizzo.app",        desc: "Family AI quiz game" },
  { name: "Tutiq",         url: "https://tutiq.app",         desc: "AI personal tutor" },
  { name: "QuizBites",     url: "https://quizbites.app",     desc: "Live classroom quiz" },
  { name: "ResumeVault",   url: "https://resumevault.app",   desc: "AI resume builder" },
  { name: "WanderAI",      url: "https://ai-travel-planner-vert.vercel.app", desc: "AI travel planner" },
  { name: "WealthPilot",   url: "https://ai-investment-tracker-delta.vercel.app", desc: "Investment tracker" },
  { name: "SpeakFast",     url: "https://language-learning-bot-blue.vercel.app", desc: "Language learning" },
  { name: "ComplyScan",    url: "https://complybuddy-y3lj4k0nv-infosivas-projects.vercel.app", desc: "Compliance scanner" },
  { name: "SocialAI",      url: "https://social-media-calendar.vercel.app", desc: "AI content calendar" },
];

const FORMSPREE_ID = "xkgjqpob";

interface Props { theme: "light" | "dark" }

export default function SharedFooter({ theme }: Props) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const isDark = theme === "dark";
  const bg     = isDark ? "#111827" : "#f9fafb";
  const border = isDark ? "#1f2937" : "#e5e7eb";
  const muted  = isDark ? "#6b7280" : "#9ca3af";
  const text   = isDark ? "#d1d5db" : "#374151";
  const link   = isDark ? "#9ca3af" : "#6b7280";
  const linkHover = isDark ? "#f3f4f6" : "#111827";
  const inputBg   = isDark ? "#1f2937" : "#ffffff";
  const inputBorder = isDark ? "#374151" : "#d1d5db";
  const btnBg     = isDark ? "#374151" : "#111827";
  const btnText   = "#ffffff";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, padding: "40px 24px 24px", marginTop: "64px" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>

        {/* More AI Tools */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: muted, fontSize: 11, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            More AI Tools
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {TOOLS.map((t) => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                title={t.desc}
                style={{ color: link, fontSize: 13, fontFamily: "sans-serif", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = link)}
              >
                {t.name}
              </a>
            ))}
          </div>
        </div>

        {/* Email capture */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: muted, fontSize: 11, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Get notified when we launch new tools
          </p>
          {status === "done" ? (
            <p style={{ color: "#10b981", fontSize: 13, fontFamily: "sans-serif" }}>
              You&apos;re in! We&apos;ll let you know about new launches.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, maxWidth: 380 }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1, background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: text,
                  fontFamily: "sans-serif", outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  background: btnBg, color: btnText, border: "none",
                  borderRadius: 8, padding: "8px 16px", fontSize: 13,
                  fontFamily: "sans-serif", cursor: "pointer", opacity: status === "sending" ? 0.6 : 1,
                }}
              >
                {status === "sending" ? "..." : "Notify me"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p style={{ color: "#ef4444", fontSize: 12, fontFamily: "sans-serif", marginTop: 6 }}>
              Something went wrong. Try again.
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: muted, fontSize: 12, fontFamily: "sans-serif" }}>
            © {new Date().getFullYear()} All rights reserved.
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy", "Terms", "Contact"].map((label) => (
              <a
                key={label}
                href={`/${label.toLowerCase()}`}
                style={{ color: muted, fontSize: 12, fontFamily: "sans-serif", textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
