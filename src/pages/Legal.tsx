import { Link } from 'react-router';

function Shell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="bg-grain min-h-screen">
      <header className="border-b border-[#751545]/10 bg-[#fbf5ef]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-[#3d0b26]">Revela</Link>
          <Link to="/" className="text-[12px] text-[#751545]/60 hover:text-[#751545]">← Back to site</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-4xl font-medium text-[#3d0b26]">{title}</h1>
        <p className="mt-2 text-[12px] uppercase tracking-widest text-[#751545]/50">Last updated: {updated}</p>
        <div className="legal-body mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-[#4a1230]/80">{children}</div>
      </main>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-medium text-[#3d0b26]">{children}</h2>;
}

const UPDATED = 'August 28, 2026';

export function Privacy() {
  return (
    <Shell title="Privacy Policy" updated={UPDATED}>
      <p>
        Revela is operated by Foorsa LLC (“Revela”, “we”, “us”). This policy explains what we collect, why we use it, and the choices available to you. Privacy questions may be sent to{' '}
        <a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a>.
      </p>

      <section>
        <H>Information we collect</H>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><b>Assessment information:</b> your first name and the answers you submit in the relationship-pattern assessment.</li>
          <li><b>Checkout and purchase information:</b> Stripe processes your payment details. We receive and store limited transaction information such as the Checkout Session identifier, payment status, amount, currency, and checkout email. We do not receive or store your full card number.</li>
          <li><b>Support information:</b> information you voluntarily include when contacting us about support, privacy, or refunds.</li>
          <li><b>Usage and technical information:</b> assessment progress, pages or stages reached, browser/device information, IP address, and approximate country/city information supplied by our hosting provider.</li>
          <li><b>Marketing measurement events:</b> after you opt in, our Meta Pixel may receive events such as page view, assessment start, assessment completion, checkout start, and verified purchase, together with standard browser/device information. We do not send your assessment-answer text to Meta.</li>
          <li><b>Optional photo:</b> if a paid customer chooses to create illustrations, the photo is sent through our server to an image-generation provider for that request. The source photo is not written to our database or permanent server storage. Generated illustrations may be cached in your own browser.</li>
        </ul>
      </section>

      <section>
        <H>How we use information</H>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>To provide the free Pattern Snapshot and paid personalized tools.</li>
          <li>To verify purchases and restore access for the same private session.</li>
          <li>To generate paid narrative content through configured AI service providers.</li>
          <li>To generate optional illustrations when you explicitly upload a photo.</li>
          <li>To operate, secure, troubleshoot, and improve the assessment and funnel.</li>
          <li>To respond to support, deletion, access, and refund requests.</li>
        </ul>
      </section>

      <section>
        <H>Service providers</H>
        <p className="mt-3">
          We use service providers for hosting and database infrastructure, payment processing, marketing measurement, and optional AI text or image generation. They process information to provide those services under their own contractual and privacy obligations. Payment information is handled by Stripe. Assessment answers may be sent to a configured AI provider only when generating paid personalized content. Meta may process marketing measurement events through the Meta Pixel; private assessment-answer text is not included in those events.
        </p>
      </section>

      <section>
        <H>Cookies and similar technologies</H>
        <p className="mt-3">
          We use local browser storage for product functionality. The Meta Pixel is loaded for advertising measurement only after you select “Allow measurement” in our privacy banner. Your browser or device settings may also allow you to limit cookies or tracking. Disabling them may affect attribution or some restoration features, but it does not prevent you from taking the free assessment.
        </p>
      </section>

      <section>
        <H>Browser storage</H>
        <p className="mt-3">
          Revela uses local browser storage to keep an anonymous session identifier, save unfinished progress, restore your result, and cache optional generated illustrations. Clearing site data in your browser removes those local copies and may prevent automatic restoration on that device.
        </p>
      </section>

      <section>
        <H>What we do not do</H>
        <p className="mt-3">
          We do not sell individual assessment answers. We do not provide advertisers with your private response history. We do not publish your optional photo or generated illustrations. We do not store full payment-card details.
        </p>
      </section>

      <section>
        <H>Retention and security</H>
        <p className="mt-3">
          We retain assessment and transaction records for as long as reasonably needed to provide access, handle refunds, prevent abuse, comply with legal obligations, and improve the service. We use HTTPS and access controls, but no online system can promise absolute security.
        </p>
      </section>

      <section>
        <H>Your choices and rights</H>
        <p className="mt-3">
          You may request access, correction, or deletion of personal information by emailing{' '}
          <a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a>. We may ask for information needed to verify the request. We aim to complete valid requests within 30 days, subject to legal retention requirements.
        </p>
      </section>

      <section>
        <H>Age requirement</H>
        <p className="mt-3">Revela is intended only for adults aged 18 and older.</p>
      </section>

      <section>
        <H>Changes</H>
        <p className="mt-3">Material changes will be posted on this page with an updated effective date.</p>
      </section>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service" updated={UPDATED}>
      <p>By using Revela, you agree to these terms. Revela is operated by Foorsa LLC.</p>

      <section>
        <H>Educational purpose</H>
        <p className="mt-3">
          Revela provides educational self-reflection and relationship decision-support content. It may organize your answers into possible patterns and practical prompts. It is not medical, psychiatric, psychological, legal, or therapeutic advice; it does not diagnose or treat any condition and is not a substitute for a qualified professional.
        </p>
      </section>

      <section>
        <H>No promised relationship outcome</H>
        <p className="mt-3">
          Revela does not guarantee dating success, reconciliation, a partner, engagement, marriage, children, or any other relationship outcome. Results depend on many factors outside the service. Optional illustrations are creative visualizations, not predictions.
        </p>
      </section>

      <section>
        <H>Eligibility</H>
        <p className="mt-3">You must be at least 18 years old and legally able to enter a contract to use the service.</p>
      </section>

      <section>
        <H>Free and paid products</H>
        <p className="mt-3">
          The assessment and Pattern Snapshot are free. The Revela Secure Love Reset is an optional one-time digital purchase. The current price and included features are displayed before checkout. Access is granted only after payment is verified by our server through Stripe.
        </p>
      </section>

      <section>
        <H>Acceptable use</H>
        <p className="mt-3">
          You may use purchased content for your own personal, non-commercial use. You may not attempt to access another person’s data, bypass payment verification, interfere with the service, scrape the product at scale, resell the content, or use the service unlawfully.
        </p>
      </section>

      <section>
        <H>Availability and AI-generated content</H>
        <p className="mt-3">
          Some personalized content is generated with automated systems and may contain errors or interpretations that do not fit. Use your judgment, take only what is useful, and seek qualified professional support for high-stakes decisions or distress. We may update, replace, or discontinue features to maintain reliability and safety.
        </p>
      </section>

      <section>
        <H>Refunds</H>
        <p className="mt-3">Eligible purchases are covered by our <Link to="/refund" className="text-[#751545] underline">Refund Policy</Link>.</p>
      </section>

      <section>
        <H>Limitation of liability</H>
        <p className="mt-3">
          To the maximum extent allowed by law, Revela is provided “as is” and Foorsa LLC is not liable for indirect, incidental, special, or consequential loss arising from your use of or reliance on the service. Nothing in these terms excludes rights that cannot legally be excluded.
        </p>
      </section>
    </Shell>
  );
}

export function Refund() {
  return (
    <Shell title="Refund Policy" updated={UPDATED}>
      <p>We want customers to be able to evaluate the Secure Love Reset without feeling trapped by the purchase.</p>

      <section>
        <H>30-day money-back guarantee</H>
        <p className="mt-3">
          Open the product and try the first tools. If the experience feels generic or unusable, email{' '}
          <a className="text-[#751545] underline" href="mailto:support@revela.love">support@revela.love</a>{' '}
          within 30 calendar days of purchase using the email entered at Stripe checkout. We will issue a full refund to the original payment method.
        </p>
      </section>

      <section>
        <H>Processing time</H>
        <p className="mt-3">After approval, Stripe and your financial institution typically take 5–10 business days to display the refund.</p>
      </section>

      <section>
        <H>Free assessment</H>
        <p className="mt-3">The assessment and Pattern Snapshot are free, so no refund applies to them.</p>
      </section>

      <section>
        <H>Abuse</H>
        <p className="mt-3">We may refuse repeated or fraudulent refund requests where permitted by law. This does not limit mandatory consumer rights.</p>
      </section>
    </Shell>
  );
}

export function Contact() {
  return (
    <Shell title="Contact Us" updated={UPDATED}>
      <p>We read every support and privacy message.</p>
      <section>
        <H>Support and refunds</H>
        <p className="mt-3"><a className="text-[#751545] underline" href="mailto:support@revela.love">support@revela.love</a> — typical response within two business days.</p>
      </section>
      <section>
        <H>Privacy requests</H>
        <p className="mt-3"><a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a> — access, correction, or deletion requests.</p>
      </section>
      <section>
        <H>Business operator</H>
        <p className="mt-3">Revela · operated by Foorsa LLC</p>
      </section>
    </Shell>
  );
}
