import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | TrackWealth",
  description: "About TrackWealth — AI investment tracker — monitor portfolios and get AI-powered financial insights.",
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">About TrackWealth</h1>

      <section className="mb-8">
        <p className="text-base leading-7">AI investment tracker — monitor portfolios and get AI-powered financial insights.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">What We Offer</h2>
        <p>
          TrackWealth is a free service built to make financial tracking more accessible through the power of artificial intelligence.
          Our tools are designed to be intuitive, fast and available to everyone — no subscription required to get started.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Built with AI</h2>
        <p>
          We use state-of-the-art AI models to deliver personalised, high-quality results. Our systems
          are continuously improving based on user feedback and the latest advances in AI research.
          All AI-generated content is clearly presented as such — we believe in transparency.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Privacy First</h2>
        <p>
          We collect only the data necessary to provide the service. We do not sell your data to third
          parties. See our{" "}
          <a href="/privacy" className="underline">Privacy Policy</a> for full details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Advertising</h2>
        <p>
          TrackWealth is supported by advertising through Google AdSense. Ads help us keep the service
          free for everyone. We work to ensure ads are relevant and non-intrusive.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Get in Touch</h2>
        <p>
          We&apos;d love to hear from you — feedback, bug reports or partnership enquiries are all welcome.
          Reach us at{" "}
          <a href="mailto:info.siva@gmail.com" className="underline">info.siva@gmail.com</a> or use our{" "}
          <a href="/contact" className="underline">contact page</a>.
        </p>
      </section>

      <p className="mt-10 opacity-40 text-xs">© 2026 TrackWealth. All rights reserved.</p>
    </main>
  );
}
