import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import LoadingButton from "./LoadingButton";
import "../../css/BackupModals.css";

export default function RestoreBackupModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  backupData, 
  username 
}) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const preventScroll = (e) => {
      e.preventDefault();
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isOpen && !closing) return null;

  const pokemonCount = Object.keys(backupData?.data?.caught || backupData?.data || {}).length;
  const backupUsername = backupData?.user?.username || 'unknown user';
  const isDifferentUser = backupUsername !== username;
  const backupDate = new Date(backupData?.backupDate || backupData?.exportDate).toLocaleString();

  const modalContent = (
    <div className={`modal-backdrop${closing ? " closing" : ""}`}>
      <div className="modal-card">
        <h2 className="modal-title">Restore Backup</h2>
        
        <p className="modal-desc">
          Are you sure you want to restore this backup? This will overwrite your current Pokemon data.
        </p>

        <div className="modal-info">
          <div><strong>Backup Details:</strong></div>
          <div>• Pokemon Count: {pokemonCount}</div>
          <div>• Created by: {backupUsername}</div>
          <div>• Backup Date: {backupDate}</div>
        </div>

        {isDifferentUser && (
          <div className="modal-warning">
            <strong>Warning:</strong> This backup was created by "{backupUsername}" but you are logged in as "{username}". 
            Make sure this is the correct backup before proceeding.
          </div>
        )}

        <div className="modal-warning">
          <strong>Important:</strong> This action cannot be undone. Your current data will be permanently replaced.
        </div>

        <div className="modal-row">
          <LoadingButton 
            variant="secondary"
            size="medium"
            onClick={handleClose}
          >
            Cancel
          </LoadingButton>
          <LoadingButton 
            variant="primary"
            size="medium"
            onClick={handleConfirm}
          >
            Restore Backup
          </LoadingButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
