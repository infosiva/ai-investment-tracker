import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TrackWealth",
  description: "Terms of service for TrackWealth — your rights and responsibilities when using our service.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="opacity-50 mb-10">Last updated: 13 May 2026</p>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using TrackWealth (https://trackwealth.app), you agree to be bound by these Terms of Service.
          If you do not agree, please do not use the service.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>AI investment tracker — monitor portfolios and get AI-powered financial insights.</p>
        <p className="mt-2">
          The service is provided free of charge. We reserve the right to modify, suspend or discontinue
          the service at any time without notice.
        </p>
      </Section>

      <Section title="3. User Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Use the service for any unlawful purpose.</li>
          <li>Attempt to gain unauthorised access to any part of the service.</li>
          <li>Interfere with or disrupt the service or its servers.</li>
          <li>Scrape, crawl or harvest data from the service without written permission.</li>
          <li>Use the service to distribute spam, malware or harmful content.</li>
          <li>Misrepresent your identity or affiliation.</li>
        </ul>
      </Section>

      <Section title="4. AI-Generated Content">
        <p>
          Parts of this service use artificial intelligence to generate content. AI-generated content may
          contain errors, inaccuracies or outdated information. You should independently verify any
          important information before relying on it. We are not liable for decisions made based on
          AI-generated output.
        </p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          All original content, design and code on this service is owned by or licensed to TrackWealth.
          You may not reproduce, distribute or create derivative works without our written permission.
        </p>
        <p className="mt-2">
          User-submitted content (if applicable) remains your property. By submitting content, you grant
          us a non-exclusive, royalty-free licence to use it to provide the service.
        </p>
      </Section>

      <Section title="6. Third-Party Links and Services">
        <p>
          The service may contain links to third-party websites. We are not responsible for the content,
          privacy practices or accuracy of any third-party sites. Visiting third-party links is at your
          own risk.
        </p>
      </Section>

      <Section title="7. Advertising">
        <p>
          This service displays advertisements provided by Google AdSense and other advertising networks.
          Advertisements are clearly labelled. We do not endorse advertisers or their products.
        </p>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          We do not warrant that the service will be uninterrupted, error-free or free of viruses.
          Use the service at your own risk.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, TrackWealth shall not be liable for any indirect,
          incidental, special or consequential damages arising from your use of the service, even if
          we have been advised of the possibility of such damages.
        </p>
      </Section>

      <Section title="10. Governing Law">
        <p>
          These terms are governed by the laws of England and Wales. Any disputes shall be subject to
          the exclusive jurisdiction of the courts of England and Wales.
        </p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>
          We may update these terms at any time. We will post the updated terms on this page with a new
          effective date. Continued use of the service constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these terms? Email us at{" "}
          <a href="mailto:info.siva@gmail.com" className="underline">info.siva@gmail.com</a>.
        </p>
      </Section>

      <p className="mt-10 opacity-40 text-xs">© 2026 TrackWealth. All rights reserved.</p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
