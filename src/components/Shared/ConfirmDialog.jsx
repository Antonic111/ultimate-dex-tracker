// ConfirmDialog.jsx
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "../../css/ConfirmDialog.css";

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
    const html = document.documentElement;

    // Check if sidebar is open before adding modal-open class
    const sidebarOpen = document.querySelector('.sidebar-overlay.open');
    
    if (!sidebarOpen) {
      // Add modal-open class to prevent scrolling only if sidebar is not open
      body.classList.add("modal-open");
      html.classList.add("modal-open");
    }

    return () => {
      // Only remove modal-open class if no other modals are open
      const progressModalOpen = document.querySelector('.progress-modal-overlay');
      const otherModalsOpen = document.querySelectorAll('.modal-overlay, .confirm-overlay').length > 1;
      
      if (!progressModalOpen && !otherModalsOpen) {
        // Cleanup function - remove modal-open class only if no other modals are open
        body.classList.remove("modal-open");
        html.classList.remove("modal-open");
      }
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
