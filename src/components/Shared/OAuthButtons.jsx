import React, { useState } from "react";
import "../../css/OAuthButtons.css";
import { buildApiUrl } from "../../config/api.js";

// Google logo SVG (official brand colors)
const GoogleIcon = () => (
  <svg className="oauth-btn-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// Discord logo SVG (official brand color #5865F2)
const DiscordIcon = () => (
  <svg className="oauth-btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.128 18.116a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

/**
 * Reusable OAuth provider buttons for Login and Register pages.
 * Each button performs a full browser redirect to the backend OAuth initiation URL.
 * 
 * @param {'stack'|'grid'} [layout='stack'] - 'stack' for vertical full-width buttons, 'grid' for 2-column side-by-side
 * @param {string} [dividerText='or'] - Text inside the divider
 * @param {boolean} [showDivider=true] - Whether to render the divider
 * @param {'top'|'bottom'} [dividerPosition='bottom'] - Where the divider appears relative to buttons
 */
export default function OAuthButtons({
  layout = "stack",
  dividerText = "OR CONTINUE WITH",
  showDivider = true,
  dividerPosition = "top",
}) {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleOAuth = (provider) => {
    setLoadingProvider(provider);
    window.location.href = buildApiUrl(`/auth/${provider}`);
  };

  const isGrid = layout === "grid";

  const dividerElement = showDivider ? (
    <div className="oauth-divider" aria-hidden="true">
      <span>{dividerText}</span>
    </div>
  ) : null;

  return (
    <div className={`oauth-buttons-section ${isGrid ? "is-grid" : "is-stack"}`}>
      {dividerPosition === "top" && dividerElement}

      <div className={isGrid ? "oauth-grid-container" : "oauth-stack-container"}>
        <button
          id="oauth-google-btn"
          type="button"
          className="oauth-btn oauth-btn--google"
          onClick={() => handleOAuth("google")}
          disabled={!!loadingProvider}
          aria-label="Continue with Google"
        >
          {loadingProvider === "google" ? (
            <span className="oauth-btn-spinner" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          <span>{isGrid ? "Google" : "Continue with Google"}</span>
        </button>

        <button
          id="oauth-discord-btn"
          type="button"
          className="oauth-btn oauth-btn--discord"
          onClick={() => handleOAuth("discord")}
          disabled={!!loadingProvider}
          aria-label="Continue with Discord"
        >
          {loadingProvider === "discord" ? (
            <span className="oauth-btn-spinner" aria-hidden="true" />
          ) : (
            <DiscordIcon />
          )}
          <span>{isGrid ? "Discord" : "Continue with Discord"}</span>
        </button>
      </div>

      {dividerPosition === "bottom" && dividerElement}
    </div>
  );
}
