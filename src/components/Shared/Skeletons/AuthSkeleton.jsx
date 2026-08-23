import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../css/Login.css";
import "../../../css/Register.css";

export default function AuthSkeleton({ type = "login" }) {
  const isRegister = type === "register";
  const fieldCount = isRegister ? 4 : 2;

  return (
    <div
      className={`${isRegister ? "register-form" : "login-form"} page-container auth-page fade-in-content`}
      aria-busy="true"
      aria-label={`Loading ${isRegister ? "registration" : "login"}`}
      style={{
        maxWidth: '512px',
        width: '100%',
        margin: '2.5rem auto 2rem auto',
        pointerEvents: 'none',
        opacity: 0.95
      }}
    >
      <h2 className={isRegister ? "register-title" : "login-title"} style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="skeleton-box" style={{ width: isRegister ? '160px' : '120px', height: '36px', borderRadius: '8px' }} />
      </h2>

      <div className={isRegister ? "register-form-fields" : "login-form-fields"}>
        {Array.from({ length: fieldCount }).map((_, idx) => (
          <div key={idx} className="input-icon-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="skeleton-box" style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0 }} />
            <div className="skeleton-box" style={{ width: `${120 + (idx % 2) * 40}px`, height: '18px', borderRadius: '4px' }} />
          </div>
        ))}

        {!isRegister && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <div className="skeleton-box" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton-box" style={{ width: '100px', height: '14px', borderRadius: '3px' }} />
          </div>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <div className="skeleton-box" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1rem' }}>
          <div className="skeleton-box" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
          {!isRegister && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <div className="skeleton-box" style={{ width: '110px', height: '14px', borderRadius: '4px' }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
