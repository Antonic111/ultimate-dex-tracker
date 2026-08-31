import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldAlert, CheckCircle, Scale, AlertTriangle, ArrowLeft, Crown, Tv, Video, ShieldCheck, CreditCard } from "lucide-react";
import "../css/LegalPages.css";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page-container">
      {/* Header Banner */}
      <div className="legal-header">
        <div className="legal-badge">
          <Scale size={14} />
          <span>User Agreement</span>
        </div>
        <h1 className="legal-title">Terms of Service</h1>
        <div className="legal-meta">
          <span className="legal-meta-item">
            <strong>Effective Date:</strong> August 29, 2026
          </span>
          <span className="legal-meta-item">•</span>
          <span className="legal-meta-item">
            <strong>Last Updated:</strong> August 29, 2026
          </span>
        </div>
      </div>

      <div className="legal-card">
        {/* Table of Contents */}
        <nav className="legal-toc" aria-label="Table of Contents">
          <div className="legal-toc-title">Table of Contents</div>
          <ul className="legal-toc-list">
            <li><a href="#acceptance" className="legal-toc-link">1. Acceptance of Terms</a></li>
            <li><a href="#description" className="legal-toc-link">2. Description of the Service</a></li>
            <li><a href="#pokemon-disclaimer" className="legal-toc-link">3. Pokémon & Nintendo Disclaimer</a></li>
            <li><a href="#eligibility" className="legal-toc-link">4. Eligibility & Accounts</a></li>
            <li><a href="#membership-billing" className="legal-toc-link">5. Paid Memberships & Merchant of Record</a></li>
            <li><a href="#streamer-tools" className="legal-toc-link">6. Streamer Tools & OBS Overlays</a></li>
            <li><a href="#oauth-terms" className="legal-toc-link">7. Google & Discord Logins</a></li>
            <li><a href="#acceptable-use" className="legal-toc-link">8. Acceptable Use, Avatars & Conduct</a></li>
            <li><a href="#creator-program" className="legal-toc-link">9. Content Creator Program & Badges</a></li>
            <li><a href="#user-content" className="legal-toc-link">10. User Content & Public Data</a></li>
            <li><a href="#intellectual-property" className="legal-toc-link">11. Intellectual Property & DMCA Notice</a></li>
            <li><a href="#availability" className="legal-toc-link">12. Service Availability & Backups</a></li>
            <li><a href="#termination" className="legal-toc-link">13. Termination & Account Deletion</a></li>
            <li><a href="#disclaimers" className="legal-toc-link">14. Disclaimer of Warranties</a></li>
            <li><a href="#liability" className="legal-toc-link">15. Limitation of Liability</a></li>
            <li><a href="#governing-law" className="legal-toc-link">16. Governing Law & Dispute Resolution</a></li>
            <li><a href="#contact" className="legal-toc-link">17. Contact Information</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="acceptance" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">1</span> Acceptance of Terms
          </h2>
          <p className="legal-paragraph">
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and <strong>Ultimate Dex Tracker</strong> ("we", "us", or "our"), governing your access to and use of the website at <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a>, including all tracker dashboards, streamer overlay tools, creator integrations, and subscription services (collectively, the "Service").
          </p>
          <p className="legal-paragraph">
            By creating an account, accessing any page, purchasing a membership, embedding overlay links, logging in via third-party OAuth, or otherwise using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy">Privacy Policy</Link>. If you do not agree to these Terms, you must discontinue using the Service immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section id="description" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">2</span> Description of the Service
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is an interactive, web-based companion application designed to allow video game players to record their Pokémon living Dex progress, manage shiny hunts, calculate encounter odds, configure custom progress bars, play Pokémon bingo, generate browser source overlays for broadcasting software, and interact with community profiles.
          </p>
          <p className="legal-paragraph">
            Core living Dex and counter features are provided free of charge for personal, non-commercial entertainment and cataloging purposes. Optional paid memberships provide visual cosmetic enhancements and specialized streaming customizations.
          </p>
        </section>

        {/* Section 3 */}
        <section id="pokemon-disclaimer" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">3</span> Pokémon & Nintendo Disclaimer (Fan Project)
          </h2>
          <div className="legal-callout">
            <div className="legal-callout-title">Important Intellectual Property Notice</div>
            <strong>Ultimate Dex Tracker is an unofficial, fan-made companion website.</strong> We are <strong>not</strong> affiliated with, sponsored by, authorized by, or endorsed by Nintendo Co., Ltd., GAME FREAK inc., Creatures Inc., or The Pokémon Company.
          </div>
          <p className="legal-paragraph">
            Pokémon, Pokémon character names, Nintendo Switch, video game artwork, sprite imagery, game mechanics, and related trademarks are registered trademarks and copyrighted intellectual property of their respective owners (Nintendo, GAME FREAK, and Creatures Inc.).
          </p>
          <p className="legal-paragraph">
            Character names, reference numbers, game categories, and sprite artwork displayed on this site are utilized strictly for informational, cataloging, and fan-companion purposes under fair use principles. No ownership or commercial claim is made over Pokémon trademarks or copyrighted characters. Paid memberships grant access solely to original web software features, database synchronization services, and custom overlay rendering developed independently by Ultimate Dex Tracker.
          </p>
        </section>

        {/* Section 4 */}
        <section id="eligibility" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">4</span> Eligibility & User Accounts
          </h2>
          <ul className="legal-list">
            <li><strong>Age Requirement:</strong> Ultimate Dex Tracker is not directed to children under the age of 13. If you are under the legal age of majority in your jurisdiction, you may only use the Service with the consent and supervision of a parent or legal guardian who agrees to be bound by these Terms.</li>
            <li><strong>Account Accuracy:</strong> You agree to provide a valid, accessible email address and maintain accurate account credentials. Registering accounts using disposable, temporary, or automated email services for abusive purposes is strictly prohibited.</li>
            <li><strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your login credentials (passwords and connected OAuth accounts) and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.</li>
            <li><strong>Non-Transferability:</strong> Accounts and purchased memberships are non-transferable and may not be sold, rented, or shared with third parties.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="membership-billing" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">5</span> Paid Memberships, Billing & Merchant of Record
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker offers optional recurring paid memberships that unlock premium cosmetic perks and streamer enhancements (such as animated GIF profile avatars, removal of overlay watermarks, custom dual-color gradient usernames with glowing aura drop-shadows, and unlocking all 4 favorite profile categories).
          </p>

          <h3 className="legal-subsection-title">A. Merchant of Record & Payment Processing (Stripe)</h3>
          <p className="legal-paragraph">
            Our order process and billing is conducted by our Merchant of Record and payment processor, <strong>Stripe</strong> (via Stripe Managed Payments). Stripe acts as the authorized Merchant of Record for membership transactions. When you purchase a membership:
          </p>
          <ul className="legal-list">
            <li>Your payment details, billing address, and transaction processing are handled directly by Stripe in compliance with PCI-DSS Level 1 security standards. Ultimate Dex Tracker never stores or has access to your full credit card numbers or banking data.</li>
            <li>Stripe is responsible for calculating, collecting, and remitting applicable sales tax, VAT, or GST based on your billing jurisdiction.</li>
            <li>By completing a purchase, you agree to Stripe's <a href="https://stripe.com/checkout/terms" target="_blank" rel="noopener noreferrer">Checkout Terms</a> and <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</li>
          </ul>

          <h3 className="legal-subsection-title">B. Subscription Billing & Automatic Renewal</h3>
          <p className="legal-paragraph">
            Memberships are billed on a recurring monthly subscription basis starting on the date of your initial purchase. Your subscription will automatically renew at the end of each monthly billing cycle at the then-current subscription rate unless you cancel prior to the renewal date.
          </p>

          <h3 className="legal-subsection-title">C. Cancellation Policy</h3>
          <p className="legal-paragraph">
            You may cancel your membership at any time with no cancellation fees. To cancel, navigate to <em>Membership &gt; Manage Subscription</em> to access the Stripe Customer Portal, or use the cancellation link in your Stripe email receipt. Upon cancellation:
          </p>
          <ul className="legal-list">
            <li>Your subscription will remain active, and you will retain access to all membership perks until the end of your current paid billing period.</li>
            <li>At the end of your billing cycle, your subscription will not renew, and your account will automatically revert to a standard free account.</li>
          </ul>

          <h3 className="legal-subsection-title">D. Refund & Cancellation Policy</h3>
          <p className="legal-paragraph">
            Because digital membership perks (animated avatars, custom gradient styling, streamer overlays, and expanded profile slots) are made available immediately upon purchase, subscription payments are subject to our dedicated <Link to="/refund-policy" style={{ fontWeight: 700, color: "var(--accent-color)" }}>Refund & Cancellation Policy</Link>, which includes statutory consumer protection rights (such as EU/UK 14-day cooling-off withdrawal rights), handling of billing errors, and straightforward self-serve cancellation.
          </p>

          <h3 className="legal-subsection-title">E. Modification of Perks & Pricing</h3>
          <p className="legal-paragraph">
            We reserve the right to modify, enhance, or adjust membership perks and pricing. Any price changes will be communicated in advance, and existing subscribers will be notified prior to renewal.
          </p>
        </section>

        {/* Section 6 */}
        <section id="streamer-tools" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">6</span> Streamer Tools & OBS Overlays
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker provides Streamer Tools that generate dedicated browser source overlay URLs (e.g. <code>/overlay/:token</code> or <code>/hunt-overlay/:token</code>) for use in live streaming software such as OBS Studio, Streamlabs, or Twitch Studio.
          </p>
          <ul className="legal-list">
            <li><strong>Token Security:</strong> Overlay URLs contain unique, read-only security tokens that allow streaming software to render your live hunt counters and living Dex progress without requiring login authentication inside the broadcasting client. You are solely responsible for maintaining the privacy of your overlay URLs. If you inadvertently expose an overlay URL on stream, you can immediately regenerate or invalidate your token in <em>Streamer Tools</em>.</li>
            <li><strong>Third-Party Software Compatibility:</strong> Overlays are designed for standard modern browser source integration. We do not guarantee uninterrupted compatibility with every third-party broadcasting application or streaming service. Ultimate Dex Tracker is not affiliated with OBS Project, Streamlabs, Twitch, or YouTube.</li>
            <li><strong>Broadcast Content:</strong> You are solely responsible for all content, chat interactions, and broadcasts displayed alongside or containing our overlays during your live streams.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="oauth-terms" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">7</span> Google & Discord Authentication
          </h2>
          <p className="legal-paragraph">
            You may register or log in using Google or Discord accounts via OAuth 2.0. By using these third-party identity providers, you agree to comply with Google's Terms of Service and Discord's Terms of Service where applicable.
          </p>
          <p className="legal-paragraph">
            You can link or unlink these providers at any time in <em>Settings &gt; Connected Accounts</em>. Ultimate Dex Tracker is not responsible for authentication disruptions or account access issues arising from third-party outages or policy changes from Google or Discord.
          </p>
        </section>

        {/* Section 8 */}
        <section id="acceptable-use" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">8</span> Acceptable Use, Avatars & Prohibited Conduct
          </h2>
          <p className="legal-paragraph">
            You agree to use Ultimate Dex Tracker in a lawful, respectful manner. You agree <strong>not</strong> to:
          </p>
          <ul className="legal-list">
            <li><strong>Inappropriate Content:</strong> Choose vulgar, abusive, hate-speech-laden, sexually explicit, defamatory, or harassing usernames, bio text, Pokémon nicknames, or hunt notes.</li>
            <li><strong>Avatar Upload Guidelines:</strong> Upload profile pictures or animated GIF avatars containing pornography, nudity, extreme violence, gore, hate symbols, copyrighted imagery without permission, or harassing material. We reserve the right to remove non-compliant avatars immediately without prior notice.</li>
            <li><strong>Infrastructure Exploitation:</strong> Probe, scan, or test the vulnerability of our API, database, or server infrastructure, or attempt to bypass security middleware, authentication mechanisms, or rate limiters.</li>
            <li><strong>Automated Scraping:</strong> Use automated bots, scrapers, crawlers, or excessive high-frequency scripts that overload or degrade the performance of our servers.</li>
            <li><strong>Impersonation & Badges:</strong> Impersonate site administrators, verified content creators, or other community members, or falsely claim official endorsement.</li>
            <li><strong>Malicious Distribution:</strong> Transmit viruses, worms, malware, or spam through bug reports, feedback submissions, or creator applications.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section id="creator-program" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">9</span> Content Creator Program & Badges
          </h2>
          <p className="legal-paragraph">
            Eligible content creators may apply for a verified Content Creator badge by submitting their streaming/video channel details.
          </p>
          <ul className="legal-list">
            <li><strong>Discretionary Verification:</strong> Verification is granted at the sole discretion of the site administrator based on content quality, community standing, and account authenticity. Submission of an application does not guarantee approval.</li>
            <li><strong>Badge Revocation:</strong> Verified creator status, badges, and promotional links may be revoked or removed at any time if a user violates these Terms, engages in toxic or discriminatory behavior, or no longer produces relevant gaming content.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="user-content" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">10</span> User Content & Public Data
          </h2>
          <p className="legal-paragraph">
            You retain ownership of the tracking data, notes, and profile text you submit to the Service. By submitting content (such as marking Pokémon caught, customizing profiles, or writing hunt notes), you grant Ultimate Dex Tracker a non-exclusive, worldwide, royalty-free license to store, process, display, and format that content solely as necessary to operate the Service and render your dashboard, overlays, and public profile.
          </p>
          <p className="legal-paragraph">
            <strong>Community Features & Privacy Controls:</strong> You can manage what content is shared publicly via <em>Settings &gt; Privacy</em> (including Public Profile visibility, Live Activity Catches Feed, Leaderboard rankings, and Detailed Stats).
          </p>
        </section>

        {/* Section 11 */}
        <section id="intellectual-property" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">11</span> Intellectual Property Rights & DMCA Notice
          </h2>
          <p className="legal-paragraph">
            All original software code, UI layout designs, CSS styling systems, algorithms, logos, and custom graphics created specifically for Ultimate Dex Tracker are the intellectual property of the project operator. You may not copy, scrape, reverse-engineer, distribute, or create unauthorized derivative works of our original code or software assets.
          </p>
          <p className="legal-paragraph">
            <strong>DMCA / Copyright Inquiries:</strong> If you are a copyright owner and believe that any content or material hosted on Ultimate Dex Tracker infringes upon your copyright, please submit a formal notice to our contact channels listed in Section 17 with the specific description and URL of the material, and we will promptly investigate and address the claim.
          </p>
        </section>

        {/* Section 12 */}
        <section id="availability" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">12</span> Service Availability, Backups & Modifications
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is provided on an "as is" and "as available" basis. While we make reasonable efforts to maintain reliable uptime and database integrity, we do not guarantee uninterrupted, error-free operation. We reserve the right to update, modify, suspend, or discontinue any feature, tool, or calculation model at any time.
          </p>
          <p className="legal-paragraph">
            <strong>Data Backups:</strong> We strongly encourage users to utilize our in-app <strong>Backup</strong> feature regularly to export and store local copies of their Living Dex collection data.
          </p>
        </section>

        {/* Section 13 */}
        <section id="termination" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">13</span> Account Termination & Data Deletion
          </h2>
          <ul className="legal-list">
            <li><strong>Self-Serve Collection Reset:</strong> You can permanently reset all saved Pokémon catches, shiny hunts, counters, progress bars, and bingo cards at any time in <em>Settings &gt; Reset Collection Data</em> via two-factor email code verification without deleting your account.</li>
            <li><strong>Self-Serve Account Deletion:</strong> You can permanently delete your account and all associated personal data at any time in <em>Settings &gt; Delete Account</em> via email verification code and username confirmation.</li>
            <li><strong>Suspension by Us:</strong> We reserve the right to suspend or terminate accounts that violate these Terms, engage in abusive scraping, attempt security breaches, upload prohibited media, or disrupt the platform.</li>
          </ul>
        </section>

        {/* Section 14 */}
        <section id="disclaimers" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">14</span> Disclaimer of Warranties
          </h2>
          <p className="legal-paragraph">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ACCURATE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
        </section>

        {/* Section 15 */}
        <section id="liability" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">15</span> Limitation of Liability
          </h2>
          <p className="legal-paragraph">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ULTIMATE DEX TRACKER, ITS DEVELOPER, OPERATOR, HOSTING PROVIDERS, OR BILLING PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICE.
          </p>
          <p className="legal-paragraph">
            IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE EXCEED THE GREATER OF FIFTY CANADIAN DOLLARS (CAD $50.00) OR THE TOTAL AMOUNT PAID BY YOU TO US IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
          </p>
        </section>

        {/* Section 16 */}
        <section id="governing-law" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">16</span> Governing Law & Jurisdiction
          </h2>
          <p className="legal-paragraph">
            These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without giving effect to any conflict of law principles. Any dispute arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in the Province of Ontario, Canada.
          </p>
        </section>

        {/* Section 17 */}
        <section id="contact" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">17</span> Contact & Inquiries
          </h2>
          <p className="legal-paragraph">
            If you have questions regarding these Terms of Service, customer support, or billing, please use the appropriate channel:
          </p>
          <ul className="legal-list">
            <li><strong>Customer & Technical Support:</strong> Available through our on-site <Link to="/feedback">Feedback & Support form</Link></li>
            <li><strong>Billing, Receipts & Invoices:</strong> Handled securely via the Stripe Customer Portal accessible in your Membership settings</li>
            <li><strong>Developer & Creator:</strong> Antonic (Solo Developer)</li>
            <li><strong>Developer Portfolio:</strong> <a href="https://antonic.ca" target="_blank" rel="noopener noreferrer">antonic.ca</a></li>
            <li><strong>Website:</strong> <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a></li>
            <li><strong>Governing Jurisdiction:</strong> Province of Ontario, Canada</li>
          </ul>
        </section>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <Link to="/" className="legal-toc-link" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            <ArrowLeft size={16} /> Back to Ultimate Dex Tracker
          </Link>
        </div>
      </div>
    </div>
  );
}
