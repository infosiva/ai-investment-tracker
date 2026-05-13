"use client";
import type { Metadata } from "next";
import { useState } from "react";

// Note: metadata must be in a separate server component if needed.
// For now, this client component handles the form.

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="opacity-50 mb-10">TrackWealth — https://trackwealth.app</p>

      <div className="mb-8">
        <p>
          Have a question, feedback or found a bug? We&apos;d love to hear from you.
          Email us directly at{" "}
          <a href="mailto:info.siva@gmail.com" className="underline font-medium">info.siva@gmail.com</a>
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Common enquiries</h2>
        <ul className="list-disc pl-5 space-y-2 opacity-70">
          <li><strong>Bug reports</strong> — describe the issue and steps to reproduce it.</li>
          <li><strong>Feature requests</strong> — tell us what you&apos;d like to see.</li>
          <li><strong>Privacy / data requests</strong> — see our <a href="/privacy" className="underline">Privacy Policy</a> for your rights.</li>
          <li><strong>Advertising</strong> — for ad-related queries, contact Google AdSense directly.</li>
          <li><strong>Copyright / DMCA</strong> — include the infringing URL and your ownership evidence.</li>
        </ul>
      </div>

      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <p className="font-medium mb-1">Email</p>
        <a href="mailto:info.siva@gmail.com" className="underline opacity-70">info.siva@gmail.com</a>
        <p className="mt-3 opacity-40 text-xs">We aim to respond within 2 business days.</p>
      </div>

      <p className="mt-10 opacity-40 text-xs">© 2026 TrackWealth. All rights reserved.</p>
    </main>
  );
}
