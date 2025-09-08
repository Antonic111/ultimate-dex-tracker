// ConfirmDialog.jsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
// import "../../css/ConfirmDialog.css"; // Moved to backup folder

let resolver = null;
let isDialogOpen = false;

export function showConfirm(message) {
  if (isDialogOpen) return Promise.resolve(false); // Prevent multiple prompts

  const container = document.createElement("div");
  document.body.appendChild(container);
  isDialogOpen = true;

  return new Promise((resolve) => {
    resolver = (result) => {
      isDialogOpen = false;
      resolve(result);
    };
    const root = createRoot(container);
    root.render(<ConfirmDialog message={message} root={root} container={container} />);
  });
}


function ConfirmDialog({ message, root, container }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.style.overflow = 'hidden';
    
    return () => {
      body.style.overflow = '';
    };
  }, []);

  function handleClose(result) {
    setClosing(true);
    setTimeout(() => {
      resolver(result);
      root.unmount();
      container.remove();
    }, 300);
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") handleClose(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className={`confirm-overlay${closing ? " closing" : ""}`}>
      <div className="confirm-panel">
        <div className="confirm-message">{message}</div>
        <div className="confirm-buttons">
          <button className="confirm-btn cancel" onClick={() => handleClose(false)}>Cancel</button>
          <button className="confirm-btn confirm" onClick={() => handleClose(true)}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
