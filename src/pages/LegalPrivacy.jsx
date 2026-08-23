import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import "../css/LegalPages.css";

export default function LegalPrivacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page-container">
      {/* Header Banner */}
      <div className="legal-header">
        <div className="legal-badge">
          <Shield size={14} />
          <span>Legal & Transparency</span>
        </div>
        <h1 className="legal-title">Privacy Policy</h1>
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
            <li><a href="#intro" className="legal-toc-link">1. Introduction</a></li>
            <li><a href="#info-we-collect" className="legal-toc-link">2. Information We Collect</a></li>
            <li><a href="#oauth-data" className="legal-toc-link">3. Google & Discord Logins</a></li>
            <li><a href="#tracker-data" className="legal-toc-link">4. Pokémon & Tracker Data</a></li>
            <li><a href="#cookies-storage" className="legal-toc-link">5. Cookies & Local Storage</a></li>
            <li><a href="#how-we-use" className="legal-toc-link">6. How We Use Information</a></li>
            <li><a href="#third-parties" className="legal-toc-link">7. Third-Party Service Providers</a></li>
            <li><a href="#retention-deletion" className="legal-toc-link">8. Data Retention & Account Deletion</a></li>
            <li><a href="#security" className="legal-toc-link">9. Security Measures</a></li>
            <li><a href="#children" className="legal-toc-link">10. Children's Privacy</a></li>
            <li><a href="#user-rights" className="legal-toc-link">11. Your Privacy Rights</a></li>
            <li><a href="#changes" className="legal-toc-link">12. Changes to This Policy</a></li>
            <li><a href="#contact" className="legal-toc-link">13. Contact & Governance</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="intro" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">1</span> Introduction
          </h2>
          <p className="legal-paragraph">
            Welcome to <strong>Ultimate Dex Tracker</strong> ("we", "our", or "the Service"), accessible at <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a>. Ultimate Dex Tracker is an independent, fan-made application designed to help Pokémon enthusiasts record, manage, and celebrate their Pokémon collections, living Dex progress, and shiny hunts across video game generations.
          </p>
          <p className="legal-paragraph">
            This Privacy Policy explains what personal information we collect when you use our website, why we collect it, how it is stored and processed, and your rights regarding your data. We are committed to collecting only the minimum data necessary to provide a reliable, personal tracking experience.
          </p>
          <div className="legal-callout">
            <div className="legal-callout-title">Pokémon & Nintendo Trademark Notice</div>
            Ultimate Dex Tracker is an unofficial fan project and is <strong>not</strong> affiliated with, endorsed by, sponsored by, or associated with Nintendo, GAME FREAK, or The Pokémon Company. All Pokémon trademarks, names, and sprite representations are property of their respective owners.
          </div>
        </section>

        {/* Section 2 */}
        <section id="info-we-collect" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">2</span> Information We Collect
          </h2>
          <p className="legal-paragraph">
            We collect information you provide directly to us when creating an account, adjusting preferences, or interacting with features:
          </p>
          
          <h3 className="legal-subsection-title">A. Account Credentials & Profile Details</h3>
          <ul className="legal-list">
            <li><strong>Username:</strong> A public identifier you choose (3–15 characters) displayed on your profile, public dex (if public), and recent catches feed.</li>
            <li><strong>Email Address:</strong> Used for account creation, email verification, password reset codes, and important transactional account notices.</li>
            <li><strong>Password:</strong> If you register via email and password, your password is encrypted using a one-way cryptographic hash (bcrypt with salt factor 10) before being stored. Plaintext passwords are never saved or accessible to us.</li>
            <li><strong>Profile Customizations (Optional):</strong> Bio, location, gender identifier, Switch friend code, Pokémon GO friend code, favorite games, favorite Pokémon, avatar trainer sprite, and external database link preferences (e.g., Serebii, Bulbapedia, PokémonDB, Smogon).</li>
            <li><strong>Social Media Links (Optional):</strong> YouTube channel or Twitch channel URLs submitted for content creator badges or public profiles.</li>
          </ul>

          <h3 className="legal-subsection-title">B. User Submissions & Feedback</h3>
          <ul className="legal-list">
            <li><strong>Bug Reports & Feedback:</strong> Titles, descriptions, and categories submitted through our in-app feedback modal. Users may submit reports anonymously or linked to their account.</li>
            <li><strong>Creator Requests:</strong> Subscriber counts, channel URLs, and content type details submitted by trainers applying for verified creator status.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="oauth-data" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">3</span> Google & Discord Authentication
          </h2>
          <p className="legal-paragraph">
            You may choose to sign in to Ultimate Dex Tracker or link external identity providers using Google or Discord OAuth 2.0. We request only the minimal necessary scopes:
          </p>

          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>OAuth Scopes Requested</th>
                  <th>Data Received & Stored</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Google</strong></td>
                  <td><code>openid</code>, <code>email</code>, <code>profile</code></td>
                  <td>Google Subject ID, Verified Email Address, Display Name, Profile Avatar URL</td>
                  <td>Authentication, account linking, preventing duplicate accounts</td>
                </tr>
                <tr>
                  <td><strong>Discord</strong></td>
                  <td><code>identify</code>, <code>email</code></td>
                  <td>Discord Account ID, Verified Email Address, Discord Username, Avatar Hash</td>
                  <td>Authentication, account linking, preventing duplicate accounts</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="legal-paragraph">
            <strong>Account Linking & Unlinking:</strong> Existing users can link or unlink their Google or Discord accounts at any time in <em>Settings &gt; Connected Accounts</em>. We enforce safety checks ensuring you cannot unlink your only authentication method without setting a password first, protecting you from accidental lockout.
          </p>
          <p className="legal-paragraph">
            We do <strong>not</strong> request access to your contacts, private messages, drive files, Discord servers/guilds, or any other permissions outside of basic identity verification.
          </p>
        </section>

        {/* Section 4 */}
        <section id="tracker-data" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">4</span> Pokémon & Tracker Data
          </h2>
          <p className="legal-paragraph">
            The core feature of Ultimate Dex Tracker is recording your Pokémon gameplay progress. The following data is saved to your account in our database:
          </p>
          <ul className="legal-list">
            <li><strong>Caught Pokémon Records:</strong> Caught flags, timestamps, custom entry notes, nicknames, Poké Ball types, marks/ribbons, encounter methods, game origins, hunt encounter counts, and stopwatch elapsed hunt times.</li>
            <li><strong>Active & Paused Shiny Hunts:</strong> Target Pokémon, hunt modifiers (e.g., Shiny Charm, research levels, lure status, sparkling power), check increments, and probability charts.</li>
            <li><strong>Dex Preferences & Filters:</strong> Form display preferences (e.g., Alolan, Galarian, Hisuian, Paldean, Gigantamax, Alpha, gender differences), shiny lock exclusions, and view modes (categorized vs. unified).</li>
            <li><strong>Bingo Grids & MMO Tools:</strong> Active bingo tiles, Pokémon targets, and Massive Mass Outbreak permutation state.</li>
            <li><strong>Recent Catches Feed:</strong> When you mark a Pokémon as caught, an entry (Pokémon name, sprite, your username, and profile sprite) is added to the live Recent Catches board for the community (unless disabled in your Privacy Settings).</li>
            <li><strong>Granular Privacy Settings:</strong> We provide full granular control over what you share with the community in <em>Settings &gt; Privacy</em>:
              <ul style={{ marginTop: "6px", marginLeft: "16px" }}>
                <li><strong>Public / Private Profile:</strong> Toggle whether your trainer card and profile are viewable by other trainers.</li>
                <li><strong>Global Live Feed:</strong> Choose whether your newly caught Pokémon are broadcast to the community live feed.</li>
                <li><strong>Leaderboard Visibility:</strong> Choose whether your collection count and ranking appear on the public Leaderboards.</li>
                <li><strong>Detailed Stats Page:</strong> Control whether other users can view your dedicated full statistics and generation breakdown page.</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="cookies-storage" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">5</span> Cookies & Local Storage
          </h2>
          <p className="legal-paragraph">
            We use browser cookies and local storage exclusively for essential operational and preference purposes. We do <strong>not</strong> use third-party advertising tracking cookies.
          </p>
          
          <h3 className="legal-subsection-title">A. Cookies</h3>
          <ul className="legal-list">
            <li><code>token</code> (Authentication Cookie): An <code>HttpOnly</code>, <code>Secure</code> (HTTPS in production), <code>SameSite</code> cookie containing a signed JSON Web Token (JWT). This keeps you logged in securely across sessions and expires after 30 days.</li>
          </ul>

          <h3 className="legal-subsection-title">B. Browser Local Storage</h3>
          <ul className="legal-list">
            <li><code>authToken</code>: Stored locally as a client-side backup for API authorization headers across cross-origin requests and mobile browsers.</li>
            <li><code>dexPreferences</code> & <code>dexToggles</code>: Stores your UI filter toggles, active sprite styles (regular vs. Pokémon HOME), and collapsed section states for instant page rendering.</li>
            <li><code>caughtInfoMap:[username]</code>: Client-side cache of your caught records enabling responsive, optimistic UI updates while offline or navigating pages.</li>
            <li><code>theme</code> & <code>accent</code>: Stores your preferred color theme (Dark/Light/System) and UI accent color choice.</li>
            <li><code>externalLinkPreference</code>: Stores your choice of external reference database (Serebii, Bulbapedia, PokémonDB, or Smogon).</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="how-we-use" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">6</span> How We Use Information
          </h2>
          <p className="legal-paragraph">
            We process your information strictly for the following operational purposes:
          </p>
          <ul className="legal-list">
            <li><strong>Providing the Service:</strong> Authenticating your identity, syncing your collection across devices, saving counters, and rendering your tracker.</li>
            <li><strong>Account Security & Verification:</strong> Dispatching 6-digit verification codes for registration, email address updates, password resets, and account deletion confirmation.</li>
            <li><strong>Abuse Prevention & Rate Limiting:</strong> Enforcing rate limits on authentication and API routes to protect our community against brute force attacks and denial-of-service attempts.</li>
            <li><strong>Service Performance:</strong> Monitoring page load performance and aggregate runtime metrics through Vercel Speed Insights.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="third-parties" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">7</span> Third-Party Service Providers
          </h2>
          <p className="legal-paragraph">
            We do not sell, rent, or trade your personal information. We share data only with the trusted infrastructure providers essential to operating the website:
          </p>

          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Service Performed</th>
                  <th>Data Transferred</th>
                  <th>Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Vercel</strong></td>
                  <td>Web Hosting, Edge CDN, Speed Insights & Performance Telemetry</td>
                  <td>IP address, request headers, browser user agent, page performance metrics</td>
                  <td><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>MongoDB Inc.</strong></td>
                  <td>Cloud Database Hosting (MongoDB Atlas)</td>
                  <td>Hashed passwords, account credentials, tracker data, hunt timers</td>
                  <td><a href="https://www.mongodb.com/legal/privacy/privacy-policy" target="_blank" rel="noopener noreferrer">MongoDB Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Resend Inc.</strong></td>
                  <td>Transactional Email Delivery</td>
                  <td>Recipient email address, username, one-time 6-digit verification codes</td>
                  <td><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Resend Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Google LLC</strong></td>
                  <td>OAuth 2.0 Social Authentication</td>
                  <td>Account ID, verified email address, display name (when using Google Login)</td>
                  <td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Discord Inc.</strong></td>
                  <td>OAuth 2.0 Social Authentication</td>
                  <td>Account ID, verified email address, username (when using Discord Login)</td>
                  <td><a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">Discord Privacy Policy</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 8 */}
        <section id="retention-deletion" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">8</span> Data Retention, Collection Reset & Account Deletion
          </h2>
          <p className="legal-paragraph">
            We retain your personal information and Pokémon tracking data for as long as your account remains active. We provide two self-serve destructive actions within <em>Settings &gt; Danger Zone</em>, each protected by 2-factor email verification code confirmation and username matching to prevent accidental loss:
          </p>

          <h3 className="legal-subsection-title">A. Reset All Collection Data</h3>
          <p className="legal-paragraph">
            If you wish to restart your journey without deleting your account credentials, you can use <strong>Reset Collection Data</strong>.
          </p>
          <ul className="legal-list">
            <li><strong>Data Wiped:</strong> All caught Pokémon, shiny hunt counters, timers, check increments, custom progress bars, and bingo card progress are permanently wiped. Public feed catch broadcasts associated with your username are removed.</li>
            <li><strong>Data Retained:</strong> Your username, email address, password, login credentials, linked Google/Discord accounts, profile metadata, and theme preferences remain active.</li>
          </ul>

          <h3 className="legal-subsection-title">B. Permanent Account Deletion</h3>
          <div className="legal-callout legal-callout-warning">
            <div className="legal-callout-title">Permanent Account Deletion (Self-Serve)</div>
            You can permanently delete your account and all associated data in <strong>Settings &gt; Delete Account</strong>.
          </div>
          <p className="legal-paragraph">
            <strong>What happens upon confirmed account deletion:</strong>
          </p>
          <ul className="legal-list">
            <li><strong>User Profile & Collection Data:</strong> Your account document, password hash, friend codes, active shiny hunts, counters, and caught Pokémon records are permanently deleted.</li>
            <li><strong>OAuth Connections:</strong> All connected Google and Discord identity links in <code>LinkedProvider</code> are permanently purged.</li>
            <li><strong>Creator Applications:</strong> Any submitted creator badge requests in <code>CreatorRequest</code> are permanently deleted.</li>
            <li><strong>Community Catches Feed:</strong> All public broadcast entries associated with your username in <code>RecentCatch</code> are permanently removed from the live feed.</li>
            <li><strong>Bug Reports & Feedback:</strong> Any bug reports you submitted are fully anonymized by detaching your user ID, preserving system stability history without retaining personal data.</li>
            <li><strong>Social Connections:</strong> Your user reference is removed from all other trainers' profile like lists.</li>
            <li><strong>Session Termination:</strong> Authentication cookies and local storage tokens are wiped immediately.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section id="security" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">9</span> Security Measures
          </h2>
          <p className="legal-paragraph">
            We employ industry-standard administrative and technical security measures to safeguard your information:
          </p>
          <ul className="legal-list">
            <li><strong>Password Hashing:</strong> Passwords are protected with bcrypt using 10 salt rounds.</li>
            <li><strong>HTTPS Encryption:</strong> All data transmitted between your browser and our servers is encrypted using Transport Layer Security (TLS/HTTPS).</li>
            <li><strong>Secure Cookie Flags:</strong> Authentication cookies are marked <code>HttpOnly</code> (inaccessible to malicious client-side JavaScript) and <code>Secure</code>.</li>
            <li><strong>CSRF & State Validation:</strong> OAuth authorization exchanges employ signed JWT state parameters to prevent Cross-Site Request Forgery.</li>
            <li><strong>Rate Limiting & 2FA Codes:</strong> Sensitive operations (login, email updates, password changes, collection reset, and account deletion) are protected by rate limiters and one-time 6-digit email confirmation codes.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="children" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">10</span> Children's Privacy
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is not intended for children under 13. If you are under the age at which you may legally consent to these Terms in your jurisdiction, you may only use the Service with the involvement and consent of a parent or legal guardian. If you are a parent or guardian and believe that your child has provided us with personal information without consent, please contact us via our Community Discord or in-app feedback, and we will promptly delete the account and associated records.
          </p>
        </section>

        {/* Section 11 */}
        <section id="user-rights" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">11</span> Your Privacy Rights
          </h2>
          <p className="legal-paragraph">
            Depending on where you live and the laws applicable to Ultimate Dex Tracker, you may have certain rights regarding your personal information:
          </p>
          <ul className="legal-list">
            <li><strong>Right to Access:</strong> You can view all your profile details, settings, and caught Pokémon data at any time inside your dashboard.</li>
            <li><strong>Right to Rectification:</strong> You can edit your username, email address, password, friend codes, and preferences at any time in Settings.</li>
            <li><strong>Right to Restrict Processing & Privacy:</strong> You can configure granular privacy preferences (Profile, Live Feed, Leaderboards, and Detailed Stats) in <em>Settings &gt; Privacy</em>.</li>
            <li><strong>Right to Collection Reset:</strong> You can wipe your collection progress while keeping your account in <em>Settings &gt; Reset Collection Data</em>.</li>
            <li><strong>Right to Erasure (Deletion):</strong> You can permanently delete your account and all associated data via <em>Settings &gt; Delete Account</em>.</li>
            <li><strong>Right to Data Portability / Backup:</strong> You can export and download your complete Pokémon collection backup file via the <em>Backup</em> page.</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section id="changes" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">12</span> Changes to This Privacy Policy
          </h2>
          <p className="legal-paragraph">
            We may update this Privacy Policy from time to time to reflect changes in our features, operational practices, or legal requirements. When updates are made, we will revise the "Last Updated" date at the top of this page. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Section 13 */}
        <section id="contact" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">13</span> Contact & Governance
          </h2>
          <p className="legal-paragraph">
            If you have questions, feedback, or privacy-related inquiries regarding this Privacy Policy, you can reach out through the following official channels:
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
