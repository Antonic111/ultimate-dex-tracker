import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, CreditCard, Tv, Sparkles, Video, Lock } from "lucide-react";
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
            <strong>Effective Date:</strong> August 29, 2026
          </span>
          <span className="legal-meta-item">•</span>
          <span className="legal-meta-item">
            <strong>Last Updated:</strong> September 25, 2026
          </span>
        </div>
      </div>

      <div className="legal-card">
        {/* Table of Contents */}
        <nav className="legal-toc" aria-label="Table of Contents">
          <div className="legal-toc-title">Table of Contents</div>
          <ul className="legal-toc-list">
            <li><a href="#intro" className="legal-toc-link">1. Introduction & Trademark Notice</a></li>
            <li><a href="#info-we-collect" className="legal-toc-link">2. Information We Collect</a></li>
            <li><a href="#oauth-data" className="legal-toc-link">3. Google & Discord Logins</a></li>
            <li><a href="#tracker-data" className="legal-toc-link">4. Pokémon & Tracker Data</a></li>
            <li><a href="#streamer-tools-privacy" className="legal-toc-link">5. Streamer Tools & Overlays</a></li>
            <li><a href="#payments-billing" className="legal-toc-link">6. Payments & Billing (Stripe)</a></li>
            <li><a href="#cookies-storage" className="legal-toc-link">7. Cookies, Local Storage & Session Storage</a></li>
            <li><a href="#how-we-use" className="legal-toc-link">8. How We Use Information</a></li>
            <li><a href="#third-parties" className="legal-toc-link">9. Third-Party Service Providers</a></li>
            <li><a href="#retention-deletion" className="legal-toc-link">10. Data Retention, Reset & Deletion</a></li>
            <li><a href="#security" className="legal-toc-link">11. Security Measures</a></li>
            <li><a href="#children" className="legal-toc-link">12. Children's Privacy</a></li>
            <li><a href="#user-rights" className="legal-toc-link">13. Your Privacy Rights</a></li>
            <li><a href="#changes" className="legal-toc-link">14. Changes to This Policy</a></li>
            <li><a href="#contact" className="legal-toc-link">15. Contact & Governance</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="intro" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">1</span> Introduction & Trademark Notice
          </h2>
          <p className="legal-paragraph">
            Welcome to <strong>Ultimate Dex Tracker</strong> ("we", "our", or "the Service"), accessible at <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a>. Ultimate Dex Tracker is an independent, fan-made web application designed to help Pokémon enthusiasts record living Dex progress, manage shiny hunts, configure streaming overlays, and participate in community features.
          </p>
          <p className="legal-paragraph">
            This Privacy Policy explains what personal information we collect, why we collect it, how it is stored and processed, and your rights regarding your data. We are committed to data minimization and transparency.
          </p>
          <div className="legal-callout">
            <div className="legal-callout-title">Pokémon & Nintendo Trademark Notice</div>
            Ultimate Dex Tracker is an unofficial fan project and is <strong>not</strong> affiliated with, endorsed by, sponsored by, or associated with Nintendo Co., Ltd., GAME FREAK inc., Creatures Inc., or The Pokémon Company. Pokémon is a registered trademark of Nintendo. All Pokémon trademarks, names, and sprite representations are property of their respective owners.
          </div>
        </section>

        {/* Section 2 */}
        <section id="info-we-collect" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">2</span> Information We Collect
          </h2>
          <p className="legal-paragraph">
            We collect information you provide directly to us when creating an account, adjusting preferences, purchasing a membership, or interacting with features:
          </p>
          
          <h3 className="legal-subsection-title">A. Account Credentials & Profile Details</h3>
          <ul className="legal-list">
            <li><strong>Username:</strong> A public identifier you choose (3–15 characters) displayed on your profile, public dex (if public), and recent catches feed.</li>
            <li><strong>Email Address:</strong> Used for account creation, email verification, password reset codes, transactional receipts, and important account notices.</li>
            <li><strong>Password:</strong> If you register via email and password, your password is encrypted using a one-way cryptographic hash (bcrypt with salt factor 10). Plaintext passwords are never saved or accessible to us.</li>
            <li><strong>Profile Customizations (Optional):</strong> Bio, location, gender identifier, Switch friend code, Pokémon GO friend code, favorite games, favorite Pokémon, favorite balls, favorite trainers, avatar trainer sprite, custom gradient colors, and external database link preferences.</li>
            <li><strong>Birthday (Optional):</strong> You may optionally choose to provide your birth month and day (and optionally year) in your profile settings. When provided, your birthday is displayed on your public trainer profile (with a celebration indicator) and enables community birthday features. Providing this information is strictly optional; birth year is optional and is not displayed publicly.</li>
            <li><strong>Custom Avatars & GIFs (Optional):</strong> If you upload a custom profile avatar or animated GIF (available with Membership), the image is transmitted to Sightengine for automated content moderation to ensure it complies with our community guidelines. Once verified, the image is optimized and stored in an encoded format directly within our database (MongoDB Atlas).</li>
            <li><strong>Social Media Links (Optional):</strong> YouTube channel or Twitch channel URLs submitted for content creator badges or public profiles.</li>
          </ul>

          <h3 className="legal-subsection-title">B. Creator Applications</h3>
          <ul className="legal-list">
            <li><strong>Creator Requests:</strong> Channel URLs, follower/subscriber counts, and content category descriptions submitted when applying for a verified Content Creator badge.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="oauth-data" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">3</span> Google & Discord Authentication
          </h2>
          <p className="legal-paragraph">
            You may choose to sign in to Ultimate Dex Tracker or link external identity providers using Google or Discord OAuth 2.0. We request only minimal necessary identity scopes:
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
            <strong>Account Linking & Unlinking:</strong> You can link or unlink your Google or Discord accounts at any time in <em>Settings &gt; Connected Accounts</em>. We enforce safety checks ensuring you cannot unlink your only authentication method without setting a password first.
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
            <li><strong>Active & Paused Shiny Hunts:</strong> Target Pokémon, hunt modifiers (Shiny Charm, research levels, sparkling power), check increments, and probability metrics.</li>
            <li><strong>Dex Preferences & Filters:</strong> Form display toggles (Alolan, Galarian, Hisuian, Paldean, Gigantamax, Alpha, gender differences), shiny lock exclusions, and view modes.</li>
            <li><strong>Bingo Grids & Progress Bars:</strong> Active bingo tiles, custom tracked Pokémon targets, and completion milestones.</li>
            <li><strong>Recent Catches Feed:</strong> When you mark a Pokémon as caught, an entry is added to the live community activity feed (unless disabled in your Privacy Settings).</li>
            <li><strong>Granular Privacy Settings:</strong> Full control over what you share with the community in <em>Settings &gt; Privacy</em> (Public Profile toggle, Live Feed toggle, Leaderboard Visibility, and Detailed Stats Page).</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="streamer-tools-privacy" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">5</span> Streamer Tools & Overlays
          </h2>
          <p className="legal-paragraph">
            Our Streamer Tools generate specialized browser source overlay URLs (e.g. <code>/overlay/:token</code>) for use in broadcasting software such as OBS Studio or Streamlabs.
          </p>
          <ul className="legal-list">
            <li><strong>Read-Only Access Tokens:</strong> Overlay links use a cryptographically generated, read-only token. Accessing the overlay URL allows the browser source to retrieve only the public data necessary to display the overlay (such as your current hunt target, counter number, and living Dex progress). It does <strong>not</strong> provide access to your email address, password, billing records, or account management settings.</li>
            <li><strong>Realtime Overlay Updates (Supabase):</strong> To deliver instantaneous hunt counter and catch updates to your streaming overlay browser source without requiring constant page reloads, our overlay service communicates with Supabase infrastructure. When you log a catch or increment a counter, live event broadcasts are delivered via secure WebSockets to synchronize your OBS or Streamlabs display in real time.</li>
            <li><strong>Token Invalidation:</strong> If you accidentally display your overlay URL on stream, you can regenerate a new token at any time in <em>Streamer Tools</em>, which instantly invalidates all previous overlay URLs.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="payments-billing" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">6</span> Payments & Billing (Stripe Managed Payments)
          </h2>
          <p className="legal-paragraph">
            Optional recurring memberships are processed by our Merchant of Record, <strong>Stripe</strong> (via Stripe Managed Payments).
          </p>
          <ul className="legal-list">
            <li><strong>Zero Storage of Payment Card Data:</strong> When you subscribe to a membership, all credit card numbers, Apple Pay/Google Pay tokens, billing addresses, and tax identifiers are collected and processed directly by Stripe in compliance with PCI-DSS Level 1 standards. Ultimate Dex Tracker never receives, processes, or stores your credit card numbers or banking credentials.</li>
            <li><strong>Subscription Metadata Stored:</strong> To provision membership perks on your account, our database stores only non-sensitive subscription metadata received from Stripe webhooks: your Stripe Customer ID, Subscription ID, subscription status (e.g., <code>active</code>, <code>past_due</code>, <code>canceled</code>), current billing cycle end date, and subscription creation timestamp.</li>
            <li><strong>Transaction Invoices & Receipts:</strong> Invoices, payment confirmation receipts, and self-service Customer Portal links are dispatched directly by Stripe to your billing email.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="cookies-storage" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">7</span> Cookies, Local Storage & Session Storage
          </h2>
          <p className="legal-paragraph">
            We use browser cookies, local storage, and session storage exclusively for essential authentication, gameplay state preservation, and user interface preferences. We do <strong>not</strong> deploy third-party advertising or commercial cross-site tracking cookies.
          </p>
          
          <h3 className="legal-subsection-title">A. Cookies</h3>
          <ul className="legal-list">
            <li><code>token</code> (Authentication Cookie): An <code>HttpOnly</code>, <code>Secure</code> (transmitted only over HTTPS in production), <code>SameSite</code> cookie containing a cryptographically signed JSON Web Token (JWT). This maintains your login session securely across pages without exposing credentials to client-side scripts and expires after 30 days.</li>
          </ul>

          <h3 className="legal-subsection-title">B. Browser Local Storage</h3>
          <p className="legal-paragraph">
            Local storage provides persistent client-side key-value caching so your settings and gameplay tools remain fast, responsive, and available across browser sessions. Data stored in your browser's local storage may include:
          </p>
          <ul className="legal-list">
            <li><strong>Authentication & Session Continuity:</strong> Temporary authentication token backups used to authorize API requests across cross-origin contexts or mobile browsers.</li>
            <li><strong>Account & Profile Caching:</strong> Cached username, display preferences, and account status indicators for instant interface rendering.</li>
            <li><strong>User & UI Preferences:</strong> Interface display theme (Dark, Light, or System), accent color choices, and preferred external Pokédex reference database (such as Serebii, Bulbapedia, or PokémonDB).</li>
            <li><strong>Pokédex Preferences & Filter State:</strong> Active generation and regional form filters, view modes (all vs. categorized), active tabs, and section collapse states.</li>
            <li><strong>Hunt & Counter State:</strong> Active shiny hunts, encounter tallies, phase history, timer configurations, pause states, and custom counter increment values.</li>
            <li><strong>BINGO State:</strong> Grid cell completion states and card configurations for active BINGO challenges.</li>
            <li><strong>Streamer Tools & Overlay Configuration:</strong> Selected overlay presets, custom positioning settings, snap grid options, and cached overlay layout preferences.</li>
            <li><strong>Migration & Client Recovery Information:</strong> Client data migration flags and synchronization markers that ensure offline or cached progress reconciles cleanly with the database.</li>
          </ul>

          <h3 className="legal-subsection-title">C. Session Storage</h3>
          <p className="legal-paragraph">
            Session storage is temporary browser memory scoped strictly to your current browser tab. Unlike local storage, data in session storage is automatically cleared by your browser as soon as the tab or window is closed.
          </p>
          <ul className="legal-list">
            <li><strong>Session Continuity & Mobile Compatibility:</strong> We temporarily store session-scoped account continuity information to prevent accidental logouts or authentication loss on mobile browsers (specifically Safari on iOS) where strict third-party cookie partitioning can otherwise interrupt active sessions. This information is session-only and is cleared immediately upon manual sign-out or when closing the tab.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="how-we-use" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">8</span> How We Use Information
          </h2>
          <p className="legal-paragraph">
            We process your information strictly for the following operational purposes:
          </p>
          <ul className="legal-list">
            <li><strong>Providing the Service:</strong> Authenticating your identity, syncing your collection across devices, saving counters, rendering overlays, and provisioning membership perks.</li>
            <li><strong>Account Security & Verification:</strong> Dispatching 6-digit verification codes for registration, email address updates, password resets, and account deletion confirmation.</li>
            <li><strong>Abuse Prevention & Rate Limiting:</strong> Enforcing rate limits on authentication and API routes to protect our community against brute force attacks and denial-of-service attempts.</li>
            <li><strong>Service Performance & Edge Analytics:</strong> Monitoring page load performance, Core Web Vitals, and aggregate runtime metrics through Vercel Analytics and Vercel Speed Insights.</li>
            <li><strong>Internal Server Health & Route Metrics:</strong> Our backend server maintains a temporary in-memory rolling buffer of recent HTTP API requests (recording general API route paths, HTTP methods, response status codes, and request durations). This data is kept strictly in volatile server memory (not written to persistent database storage) and aggregated into short-term hourly buckets for administrative system health, diagnostic troubleshooting, and route performance monitoring.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section id="third-parties" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">9</span> Third-Party Service Providers
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
                  <td><strong>Vercel Inc.</strong></td>
                  <td>Web Hosting, Edge CDN & Performance Telemetry</td>
                  <td>IP address, request headers, browser user agent, performance metrics</td>
                  <td><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Stripe Inc.</strong></td>
                  <td>Merchant of Record & Subscription Billing (Stripe Managed Payments)</td>
                  <td>Customer email, billing address, payment details, subscription status</td>
                  <td><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>MongoDB Inc.</strong></td>
                  <td>Cloud Database Hosting (MongoDB Atlas)</td>
                  <td>Hashed passwords, account credentials, tracker data, hunt timers</td>
                  <td><a href="https://www.mongodb.com/legal/privacy/privacy-policy" target="_blank" rel="noopener noreferrer">MongoDB Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Sightengine SAS</strong></td>
                  <td>Automated Content Moderation (Avatar Uploads)</td>
                  <td>Uploaded image file buffer during custom profile avatar submission</td>
                  <td><a href="https://sightengine.com/privacy-policy" target="_blank" rel="noopener noreferrer">Sightengine Privacy Policy</a></td>
                </tr>
                <tr>
                  <td><strong>Supabase, Inc.</strong></td>
                  <td>Realtime Event Broadcasting (Streamer Tools & Overlays)</td>
                  <td>Live hunt counter updates, catch event broadcasts, and overlay synchronization metadata</td>
                  <td><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></td>
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

        {/* Section 10 */}
        <section id="retention-deletion" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">10</span> Data Retention, Collection Reset & Account Deletion
          </h2>
          <p className="legal-paragraph">
            We retain your personal information and Pokémon tracking data for as long as your account remains active. We provide two self-serve destructive actions within <em>Settings &gt; Danger Zone</em>, each protected by 2-factor email verification code confirmation and username matching:
          </p>

          <h3 className="legal-subsection-title">A. Reset All Collection Data</h3>
          <p className="legal-paragraph">
            If you wish to restart your journey without deleting your account credentials, you can use <strong>Reset Collection Data</strong>.
          </p>
          <ul className="legal-list">
            <li><strong>Data Wiped:</strong> All caught Pokémon, shiny hunt counters, timers, check increments, custom progress bars, and bingo card progress are permanently wiped. Public feed catch broadcasts associated with your username are removed.</li>
            <li><strong>Data Retained:</strong> Your username, email address, password, login credentials, linked Google/Discord accounts, profile metadata, active membership status, and theme preferences remain active.</li>
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
            <li><strong>Session Termination & Browser Cache Purge:</strong> Authentication cookies are cleared server-side, and account-specific credentials, cached profile records, and personal gameplay data stored in your browser's local storage and session storage are purged from your active device upon deletion. Harmless non-personal device preferences (such as your chosen UI theme) may remain saved on the device.</li>
          </ul>

          <h3 className="legal-subsection-title">C. Retention of Billing, Subscription & Tax Records</h3>
          <p className="legal-paragraph">
            While your public profile, login credentials, and all Pokémon tracking data are permanently deleted from active databases upon confirmed account deletion, limited transaction and subscription records (such as Stripe customer identifiers, subscription history, payment event logs, and invoice receipts) may be retained for the period necessary to comply with legitimate business, accounting, tax, fraud prevention, chargeback defense, and statutory legal obligations. These records are not attached to an active public profile or gameplay account and are maintained in accordance with applicable financial record-keeping standards.
          </p>
        </section>

        {/* Section 11 */}
        <section id="security" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">11</span> Security Measures
          </h2>
          <p className="legal-paragraph">
            We employ industry-standard administrative and technical security measures to safeguard your information:
          </p>
          <ul className="legal-list">
            <li><strong>Password Hashing:</strong> Passwords are protected with bcrypt using 10 salt rounds.</li>
            <li><strong>HTTPS Encryption:</strong> All data transmitted between your browser and our servers is encrypted using Transport Layer Security (TLS/HTTPS).</li>
            <li><strong>Secure Cookie Flags:</strong> Authentication cookies are marked <code>HttpOnly</code> (inaccessible to client-side JavaScript) and <code>Secure</code>.</li>
            <li><strong>CSRF & State Validation:</strong> OAuth authorization exchanges employ signed JWT state parameters to prevent Cross-Site Request Forgery.</li>
            <li><strong>Rate Limiting & 2FA Codes:</strong> Sensitive operations (login, email updates, password changes, collection reset, and account deletion) are protected by rate limiters and one-time 6-digit email confirmation codes.</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section id="children" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">12</span> Children's Privacy
          </h2>
          <p className="legal-paragraph">
            Ultimate Dex Tracker is not directed to children under 13. If you are under the age of majority in your jurisdiction, you may only use the Service with the consent of a parent or legal guardian. If you are a parent or guardian and believe that your child has provided us with personal information without consent, please contact us, and we will promptly delete the account and associated records.
          </p>
        </section>

        {/* Section 13 */}
        <section id="user-rights" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">13</span> Your Privacy Rights
          </h2>
          <p className="legal-paragraph">
            Depending on where you reside (including under GDPR, CCPA/CPRA, and Canadian PIPEDA regulations), you have rights regarding your personal information:
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

        {/* Section 14 */}
        <section id="changes" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">14</span> Changes to This Privacy Policy
          </h2>
          <p className="legal-paragraph">
            We may update this Privacy Policy periodically to reflect updates to our features, legal standards, or operational practices. When updates are made, we will revise the "Last Updated" date at the top of this page.
          </p>
        </section>

        {/* Section 15 */}
        <section id="contact" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">15</span> Contact & Inquiries
          </h2>
          <p className="legal-paragraph">
            If you have questions regarding this Privacy Policy, your personal data, or billing inquiries, please use the appropriate channel:
          </p>
          <ul className="legal-list">
            <li><strong>Privacy & Data Inquiries:</strong> Available through our on-site <Link to="/support">Support form</Link></li>
            <li><strong>Billing & Payment Privacy:</strong> Handled securely via the Stripe Customer Portal accessible in your Membership settings</li>
            <li><strong>Developer & Creator:</strong> Antonic (Solo Developer)</li>
            <li><strong>Developer Portfolio:</strong> <a href="https://antonic.ca" target="_blank" rel="noopener noreferrer">antonic.ca</a></li>
            <li><strong>Website:</strong> <a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a></li>
            <li><strong>Terms of Service:</strong> Review full terms and service rules in our <Link to="/terms">Terms of Service</Link></li>
            <li><strong>Refunds & Cancellations:</strong> Review subscription cancellation and refund terms in our <Link to="/refund-policy">Refund & Cancellation Policy</Link></li>
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
