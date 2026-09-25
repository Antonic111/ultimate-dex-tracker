import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowLeft, Shield, CreditCard, Clock, HelpCircle, CheckCircle2 } from "lucide-react";
import "../css/LegalPages.css";

export default function RefundPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page-container">
      {/* Header Banner */}
      <div className="legal-header">
        <div className="legal-badge">
          <RefreshCw size={14} />
          <span>Billing & Consumer Protection</span>
        </div>
        <h1 className="legal-title">Refund & Cancellation Policy</h1>
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
            <li><a href="#intro" className="legal-toc-link">1. Overview & Merchant of Record</a></li>
            <li><a href="#cancellation" className="legal-toc-link">2. Subscription Cancellation Policy</a></li>
            <li><a href="#refund-eligibility" className="legal-toc-link">3. Refund Eligibility & Statutory Rights</a></li>
            <li><a href="#how-to-request" className="legal-toc-link">4. How to Request a Refund</a></li>
            <li><a href="#processing" className="legal-toc-link">5. Refund Processing Times & Method</a></li>
            <li><a href="#chargebacks" className="legal-toc-link">6. Chargebacks & Payment Inquiries</a></li>
            <li><a href="#contact" className="legal-toc-link">7. Contact & Support</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="intro" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">1</span> Overview & Merchant of Record
          </h2>
          <p className="legal-paragraph">
            This Refund and Cancellation Policy applies to all paid subscriptions and digital memberships purchased on <strong>Ultimate Dex Tracker</strong> (<a href="https://www.ultimatedextracker.com" target="_blank" rel="noopener noreferrer">ultimatedextracker.com</a>).
          </p>
          <p className="legal-paragraph">
            All orders, transactions, billing, tax calculation, and payment processing are fulfilled by our authorized Merchant of Record, <strong>Stripe</strong> (via Stripe Managed Payments). Stripe acts as the legal Merchant of Record for all our membership transactions and provides customer billing support in partnership with us.
          </p>
          <div className="legal-callout">
            <div className="legal-callout-title">Digital Fan-Made Service & Trademark Notice</div>
            Ultimate Dex Tracker is an unofficial fan project and is <strong>not</strong> affiliated with, endorsed by, or sponsored by Nintendo, GAME FREAK, or The Pokémon Company. Pokémon is a registered trademark of Nintendo. Paid memberships provide access to digital cloud features, streamer overlays, custom profile badges, and enhanced organization tools.
          </div>
        </section>

        {/* Section 2 */}
        <section id="cancellation" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">2</span> Subscription Cancellation Policy
          </h2>
          <p className="legal-paragraph">
            You may cancel your monthly Premium Membership at any time with no questions asked, cancellation fees, or penalties.
          </p>
          <ul className="legal-list">
            <li><strong>Self-Service Cancellation:</strong> You can cancel your subscription instantly at any time by visiting your profile settings, clicking <em>"Manage Subscription"</em> to open the Stripe Customer Portal, or using the cancellation link provided in every Stripe email invoice receipt.</li>
            <li><strong>Keep Your Perks Until Period End:</strong> When you cancel, your subscription will not renew for subsequent billing cycles. You will retain full access to all Premium benefits (including custom avatars, animated GIFs, 4 favorite categories, streamer overlays, and gold badges) until the final second of your current prepaid billing period.</li>
            <li><strong>No Automatic Termination:</strong> Canceling a subscription does not delete your Pokémon collection, shiny hunt logs, or account data.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="refund-eligibility" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">3</span> Refund Eligibility & Statutory Rights
          </h2>
          
          <h3 className="legal-subsection-title">A. 14-Day Cooling-Off Period (EU, UK & Applicable Jurisdictions)</h3>
          <p className="legal-paragraph">
            If you reside in the European Union, the United Kingdom, or another jurisdiction with statutory consumer withdrawal rights, you have the legal right to cancel your purchase and request a full refund within <strong>14 days</strong> of your initial subscription purchase without providing any reason.
          </p>

          <h3 className="legal-subsection-title">B. Technical Issues & Accidental Duplicate Billing</h3>
          <p className="legal-paragraph">
            We want you to be completely satisfied with Ultimate Dex Tracker. We will gladly issue a full refund if:
          </p>
          <ul className="legal-list">
            <li><strong>Duplicate Charges:</strong> You were charged more than once for the same billing cycle due to a technical error.</li>
            <li><strong>Unresolved Technical Outages:</strong> You encountered a critical software bug preventing you from using membership perks, and our team was unable to resolve it promptly.</li>
            <li><strong>Unauthorized Transactions:</strong> A fraudulent charge occurred on your payment method that was not authorized by you.</li>
          </ul>

          <h3 className="legal-subsection-title">C. Ineligible Cases</h3>
          <p className="legal-paragraph">
            Refunds cannot be granted for:
          </p>
          <ul className="legal-list">
            <li>Requests submitted more than 14 days after the billing date where the service was fully functional and used.</li>
            <li>Accounts terminated or suspended due to severe violations of our <Link to="/terms">Terms of Service</Link> (e.g., uploading illegal or abusive avatar imagery, malicious DDoS attacks, or harassment).</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="how-to-request" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">4</span> How to Request a Refund
          </h2>
          <p className="legal-paragraph">
            All billing, transactions, and refund disbursements are processed by our authorized Merchant of Record, <strong>Stripe</strong>. To request a refund:
          </p>
          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>How to Submit</th>
                  <th>Typical Response Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Feedback & Support Form</strong></td>
                  <td>Submit a ticket via our <Link to="/support">Support</Link> page with your account username to request a review.</td>
                  <td>Typically within 1–3 business days</td>
                </tr>
                <tr>
                  <td><strong>Stripe Billing Portal / Receipt Link</strong></td>
                  <td>Click the <em>"Manage Subscription"</em> or <em>"View Invoice"</em> link located in your <Link to="/membership">Membership Settings</Link> or at the bottom of any email receipt received from Stripe.</td>
                  <td>Instant lookup</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5 */}
        <section id="processing" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">5</span> Refund Processing Times & Method
          </h2>
          <ul className="legal-list">
            <li><strong>Original Payment Method:</strong> All approved refunds are credited back directly to the original payment method used during checkout (Credit/Debit Card, Apple Pay, or Google Pay). Refunds cannot be issued to alternate accounts or third parties.</li>
            <li><strong>Bank Processing Times:</strong> Once a refund is initiated, it typically reflects in your bank or card statement within <strong>3 to 5 business days</strong> (depending on your financial institution).</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="chargebacks" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">6</span> Chargebacks & Inquiries
          </h2>
          <p className="legal-paragraph">
            If you do not recognize a charge or have a question about your bill, please inspect your invoices via the Stripe Customer Portal in your <Link to="/membership">Membership Settings</Link> or submit a message through the <Link to="/support">Support</Link> page before initiating a bank dispute or chargeback. We can quickly look up receipts, cancel subscriptions, and issue eligible refunds directly.
          </p>
        </section>

        {/* Section 7 */}
        <section id="contact" className="legal-section">
          <h2 className="legal-section-title">
            <span className="section-number">7</span> Contact & Support
          </h2>
          <p className="legal-paragraph">
            For all questions regarding memberships, transactions, receipts, cancellations, or refunds:
          </p>
          <ul className="legal-list">
            <li><strong>Support & Billing Assistance:</strong> Available through the on-site <Link to="/support">Support Form</Link> (typical response time within 1–3 business days)</li>
            <li><strong>Self-Service Billing Portal:</strong> Accessible via <Link to="/membership">Membership Settings</Link></li>
            <li><strong>Terms of Service:</strong> Review full terms and service rules in our <Link to="/terms">Terms of Service</Link></li>
            <li><strong>Privacy Policy:</strong> Review how personal and billing data is handled in our <Link to="/privacy">Privacy Policy</Link></li>
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
