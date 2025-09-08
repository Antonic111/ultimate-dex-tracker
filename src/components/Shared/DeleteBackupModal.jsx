import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import LoadingButton from "./LoadingButton";
import "../../css/BackupModals.css";

export default function DeleteBackupModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  backupData 
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
  const backupDate = new Date(backupData?.backupDate || backupData?.exportDate).toLocaleString();

  const modalContent = (
    <div className={`modal-backdrop${closing ? " closing" : ""}`}>
      <div className="modal-card">
        <h2 className="modal-title">Delete Backup</h2>
        
        <p className="modal-desc">
          Are you sure you want to delete this backup? This action cannot be undone.
        </p>

        <div className="modal-info">
          <div><strong>Backup Details:</strong></div>
          <div>• Pokemon Count: {pokemonCount}</div>
          <div>• Created by: {backupUsername}</div>
          <div>• Backup Date: {backupDate}</div>
        </div>

        <div className="modal-warning">
          <strong>Warning:</strong> This will permanently remove the backup from your local storage. 
          The backup data will be lost forever.
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
            variant="danger"
            size="medium"
            onClick={handleConfirm}
          >
            Delete Backup
          </LoadingButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
