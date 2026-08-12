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
        <div className="legal-body mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-[#4a1230]/80">
          {children}
        </div>
      </main>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-medium text-[#3d0b26]">{children}</h2>;
}

const UPDATED = 'August 12, 2026';

export function Privacy() {
  return (
    <Shell title="Privacy Policy" updated={UPDATED}>
      <p>Revela, a brand operated by Foorsa LLC (“Revela”, “we”, “us”), respects your privacy. This policy explains what we collect, why, and the choices you have. Questions: <a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a>.</p>

      <section><H>What we collect</H>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li><b>Assessment answers</b> — the responses you give in the 21-question assessment, used to generate your report.</li>
          <li><b>Contact details you provide</b> — first name, email, and (optionally) phone number and date of birth.</li>
          <li><b>Usage data</b> — pages visited, assessment progress, device type, and approximate location derived from your IP address (country/city level only), used to operate and improve the service.</li>
          <li><b>Photo (optional)</b> — if you add one, it stays on your device; we store only the fact that a photo was added.</li>
        </ul>
      </section>

      <section><H>How we use it</H>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>To generate and deliver your personal report.</li>
          <li>To respond to support or refund requests.</li>
          <li>To understand, in aggregate, how visitors use the assessment (e.g. completion rates) so we can improve it.</li>
        </ul>
      </section>

      <section><H>What we never do</H>
        <p className="mt-3">We do not sell your data. We do not share your individual answers with advertisers. We do not publish your photo. We do not use your assessment answers to build advertising profiles.</p>
      </section>

      <section><H>Storage & security</H>
        <p className="mt-3">Data is transmitted over HTTPS and stored encrypted. Assessment progress you leave unfinished is kept in your own browser’s local storage so you can resume; you can clear it at any time through your browser settings.</p>
      </section>

      <section><H>Your rights</H>
        <p className="mt-3">You may request a copy, correction, or deletion of your data at any time by emailing <a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a>. Deletion requests are honored within 30 days.</p>
      </section>

      <section><H>Cookies</H>
        <p className="mt-3">We use a single anonymous identifier stored in your browser to keep your session and progress together. We do not use third-party advertising cookies on the assessment.</p>
      </section>

      <section><H>Changes</H>
        <p className="mt-3">If we update this policy, we will post the new version here with a fresh “last updated” date.</p>
      </section>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service" updated={UPDATED}>
      <p>By using Revela you agree to these terms. If you do not agree, please do not use the service. Revela is a brand operated by Foorsa LLC ("we", "us").</p>

      <section><H>What Revela is</H>
        <p className="mt-3">Revela is an educational self-reflection tool. The assessment and reports are informed by published relationship and attachment research and are intended to prompt insight and reflection.</p>
      </section>

      <section><H>What Revela is not</H>
        <p className="mt-3">Revela is not medical, psychological, or therapeutic advice, and is not a diagnosis or treatment. It is not a substitute for a licensed therapist or physician. If you are experiencing distress, please consult a qualified professional. No report, reading, or communication from Revela guarantees any relationship outcome.</p>
      </section>

      <section><H>Eligibility</H>
        <p className="mt-3">You must be at least 18 years old to use this service.</p>
      </section>

      <section><H>Paid products</H>
        <p className="mt-3">Optional paid products (such as the Revela Blueprint) are one-time purchases delivered digitally. Prices are shown at checkout. Purchases are covered by our <Link to="/refund" className="text-[#751545] underline">Refund Policy</Link>.</p>
      </section>

      <section><H>Acceptable use</H>
        <p className="mt-3">You agree not to misuse the service, attempt to access other users’ data, or misrepresent your identity.</p>
      </section>

      <section><H>Limitation of liability</H>
        <p className="mt-3">To the maximum extent permitted by law, Revela is provided “as is” without warranties of any kind, and we are not liable for indirect or consequential damages arising from your use of the service.</p>
      </section>
    </Shell>
  );
}

export function Refund() {
  return (
    <Shell title="Refund Policy" updated={UPDATED}>
      <p>We want you to feel safe trying the Revela Blueprint.</p>

      <section><H>30-day money-back guarantee</H>
        <p className="mt-3">If you purchase the Revela Blueprint and it isn’t right for you, email <a className="text-[#751545] underline" href="mailto:support@revela.love">support@revela.love</a> within 30 days of purchase with the email you used at checkout, and we will issue a full refund. No questions asked, no forms.</p>
      </section>

      <section><H>Processing time</H>
        <p className="mt-3">Refunds are processed within 5–10 business days to your original payment method, depending on your bank.</p>
      </section>

      <section><H>Free assessment</H>
        <p className="mt-3">The assessment and core report are free — no payment is ever taken for them, so no refund applies.</p>
      </section>
    </Shell>
  );
}

export function Contact() {
  return (
    <Shell title="Contact Us" updated={UPDATED}>
      <p>We read every message.</p>
      <section><H>Support & refunds</H>
        <p className="mt-3"><a className="text-[#751545] underline" href="mailto:support@revela.love">support@revela.love</a> — we reply within 2 business days.</p>
      </section>
      <section><H>Privacy requests</H>
        <p className="mt-3"><a className="text-[#751545] underline" href="mailto:privacy@revela.love">privacy@revela.love</a> — data access, correction, and deletion.</p>
      </section>
      <section><H>Business</H>
        <p className="mt-3">Revela · operated by Foorsa LLC</p>
      </section>
    </Shell>
  );
}
