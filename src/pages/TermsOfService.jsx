import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldAlert, CheckCircle, Scale, AlertTriangle, ArrowLeft } from "lucide-react";
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
            <strong>Effective Date:</strong> August 19, 2026
          </span>
          <span className="legal-meta-item">•</span>
          <span className="legal-meta-item">
            <strong>Last Updated:</strong> August 19, 2026
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
            <li><a href="#oauth-terms" className="legal-toc-link">5. Google & Discord Logins</a></li>
            <li><a href="#acceptable-use" className="legal-toc-link">6. Acceptable Use & Conduct</a></li>
            <li><a href="#user-content" className="legal-toc-link">7. User Content & Public Data</a></li>
            <li><a href="#intellectual-property" className="legal-toc-link">8. Intellectual Property Rights</a></li>
            <li><a href="#availability" className="legal-toc-link">9. Availability & Changes</a></li>
            <li><a href="#termination" className="legal-toc-link">10. Termination & Deletion</a></li>
            <li><a href="#disclaimers" className="legal-toc-link">11. Disclaimer of Warranties</a></li>
            <li><a href="#liability" className="legal-toc-link">12. Limitation of Liability</a></li>
            <li><a href="#governing-law" className="legal-toc-link">13. Governing Law & Dispute Resolution</a></li>
            <li><a href="#contact" className="legal-toc-link">14. Contact Information</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="acceptance" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">1</span> Acceptance of Terms
          </h2>
          <p className="legal-paragraph">
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and <strong>Ultimate Dex Tracker</strong> ("we", "us", or "our"), governing your access to and use of the website at <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a> and associated tracking tools.
          </p>
          <p className="legal-paragraph">
            By creating an account, logging in via Google or Discord, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, you must discontinue using the Service.
          </p>
        </section>

        {/* Section 2 */}
        <section id="description" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">2</span> Description of the Service
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is an interactive, web-based companion application designed to allow video game players to record their Pokémon living Dex progress, manage shiny hunts, calculate encounter odds, configure custom progress bars, play Pokémon bingo, and participate in community catch feeds.
          </p>
          <p className="legal-paragraph">
            The Service is provided free of charge for personal, non-commercial entertainment and tracking purposes.
          </p>
        </section>

        {/* Section 3 */}
        <section id="pokemon-disclaimer" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">3</span> Pokémon & Nintendo Disclaimer
          </h2>
          <div className="legal-callout">
            <div className="legal-callout-title">Important Intellectual Property Notice</div>
            <strong>Ultimate Dex Tracker is an unofficial fan-made project.</strong> We are <strong>not</strong> affiliated with, sponsored by, endorsed by, or in any way associated with Nintendo Co., Ltd., GAME FREAK inc., Creatures Inc., or The Pokémon Company.
          </div>
          <p className="legal-paragraph">
            Pokémon, Pokémon character names, Nintendo Switch, video game artwork, game mechanics, and related trademarks are registered trademarks and copyrighted material of their respective owners (Nintendo, GAME FREAK, and Creatures Inc.). Use of character names and reference data on this site is done purely for informational, cataloging, and fan-companion purposes.
          </p>
        </section>

        {/* Section 4 */}
        <section id="eligibility" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">4</span> Eligibility & User Accounts
          </h2>
          <ul className="legal-list">
            <li><strong>Age Requirement:</strong> Ultimate Dex Tracker is not intended for children under 13. If you are under the age at which you may legally consent to these Terms in your jurisdiction, you may only use the Service with the involvement and consent of a parent or legal guardian.</li>
            <li><strong>Account Accuracy:</strong> You agree to provide a valid email address and maintain accurate information. You may not register an account using disposable/temporary email addresses for malicious purposes.</li>
            <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials (passwords, email accounts, and connected OAuth accounts). You agree to notify us immediately of any unauthorized access to your account.</li>
            <li><strong>One Person per Account:</strong> You may not share your account or transfer your account credentials to another individual.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="oauth-terms" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">5</span> Google & Discord Authentication
          </h2>
          <p className="legal-paragraph">
            You may register or log in using your Google or Discord accounts via OAuth 2.0. By using these third-party login providers, you also agree to comply with Google's Terms of Service and Discord's Terms of Service where applicable.
          </p>
          <p className="legal-paragraph">
            You can link or unlink these providers at any time in your Account Settings. Ultimate Dex Tracker is not responsible for any login failures or authentication disruptions caused by outages or policy changes from Google or Discord.
          </p>
        </section>

        {/* Section 6 */}
        <section id="acceptable-use" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">6</span> Acceptable Use & Prohibited Conduct
          </h2>
          <p className="legal-paragraph">
            You agree to use Ultimate Dex Tracker in a lawful, respectful manner. You agree <strong>not</strong> to:
          </p>
          <ul className="legal-list">
            <li>Choose vulgar, abusive, hate-speech-laden, sexually explicit, or infringing usernames, bio text, or Pokémon nicknames. Content filters are enforced, and violations may result in immediate suspension.</li>
            <li>Attempt to probe, scan, or exploit vulnerabilities in our API, database, or server infrastructure.</li>
            <li>Bypass or attempt to defeat rate limiting, security safeguards, or authentication middlewares.</li>
            <li>Use automated bots, scrapers, or excessive bulk scripts that overload or degrade the performance of our servers.</li>
            <li>Impersonate administrators, content creators, or other trainers.</li>
            <li>Transmit malware, viruses, harmful code, or spam through bug reports, feedback forms, or creator applications.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="user-content" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">7</span> User Content & Public Data
          </h2>
          <p className="legal-paragraph">
            You retain ownership of the tracking data, notes, and profile text you submit to the Service. By submitting content (such as marking Pokémon caught, customizing profiles, or writing hunt notes), you grant Ultimate Dex Tracker a non-exclusive, worldwide, royalty-free license to store, process, display, and format that content solely as necessary to operate the Service and render your dashboard and public profile (if enabled).
          </p>
          <p className="legal-paragraph">
            <strong>Community Features & Granular Privacy:</strong> You can manage what content is shared publicly via <em>Settings &gt; Privacy</em>:
          </p>
          <ul className="legal-list">
            <li><strong>Public Profiles:</strong> Allows other trainers to view your trainer card and Living Dex completion stats.</li>
            <li><strong>Recent Catches Feed:</strong> Broadcasts newly caught Pokémon to the live community activity feed.</li>
            <li><strong>Leaderboard Visibility:</strong> Displays your collection count and ranking on the global top 50 leaderboard.</li>
            <li><strong>Detailed Stats Page:</strong> Enables other trainers to view your dedicated statistics breakdown page.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="intellectual-property" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">8</span> Intellectual Property Rights
          </h2>
          <p className="legal-paragraph">
            All original software code, UI design, color schemes, logos, and custom graphics created specifically for Ultimate Dex Tracker are the intellectual property of the project operator. You may not copy, scrape, distribute, or create unauthorized derivative works of our original code and assets, nor attempt to circumvent security safeguards.
          </p>
        </section>

        {/* Section 9 */}
        <section id="availability" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">9</span> Service Availability & Modifications
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is provided on an "as is" and "as available" basis. We strive to maintain high uptime, but we do not guarantee uninterrupted, error-free operation. We reserve the right to modify, update, suspend, or discontinue any feature (such as tools, sprite sets, or calculators) at any time without prior notice.
          </p>
          <p className="legal-paragraph">
            We strongly recommend using our in-app <strong>Backup</strong> tool regularly to download and preserve a local copy of your collection records.
          </p>
        </section>

        {/* Section 10 */}
        <section id="termination" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">10</span> Account Termination & Data Reset
          </h2>
          <ul className="legal-list">
            <li><strong>Reset All Collection Data (Self-Serve):</strong> You may permanently wipe all saved Pokémon catches, shiny hunts, progress bars, and bingo cards at any time via <em>Settings &gt; Reset Collection Data</em> using 2-factor email code verification. Your account, credentials, and profile settings will remain active.</li>
            <li><strong>Account Deletion (Self-Serve):</strong> You may permanently delete your account and all associated data at any time in <em>Settings &gt; Delete Account</em> via email verification code and username confirmation.</li>
            <li><strong>Suspension by Us:</strong> We reserve the right to suspend or terminate accounts that violate these Terms, engage in abusive scraping, attempt security breaches, or disrupt the community.</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section id="disclaimers" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">11</span> Disclaimer of Warranties
          </h2>
          <p className="legal-paragraph">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE DATA ON THE SERVICE WILL BE ACCURATE, UNINTERRUPTED, OR FREE OF ERRORS OR LOSS.
          </p>
        </section>

        {/* Section 12 */}
        <section id="liability" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">12</span> Limitation of Liability
          </h2>
          <p className="legal-paragraph">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL ULTIMATE DEX TRACKER, ITS CREATOR, OR ITS HOSTING PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, OPPORTUNITY, OR ENJOYMENT ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        {/* Section 13 */}
        <section id="governing-law" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">13</span> Governing Law & Jurisdiction
          </h2>
          <p className="legal-paragraph">
            These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
          </p>
        </section>

        {/* Section 14 */}
        <section id="contact" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">14</span> Contact Information
          </h2>
          <p className="legal-paragraph">
            If you have questions regarding these Terms of Service, please reach out via our official developer and community channels:
          </p>
          <ul className="legal-list">
            <li><strong>Developer & Creator:</strong> Antonic (Solo Developer)</li>
            <li><strong>Developer Portfolio:</strong> <a href="https://antonic.ca" target="_blank" rel="noopener noreferrer">antonic.ca</a></li>
            <li><strong>Website:</strong> <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a></li>
            <li><strong>Community Discord:</strong> <a href="https://discord.com/invite/YE9uCuQcrW" target="_blank" rel="noopener noreferrer">discord.com/invite/YE9uCuQcrW</a></li>
            <li><strong>In-App Feedback:</strong> Accessible via the <Link to="/feedback">Feedback</Link> link in the footer</li>
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
