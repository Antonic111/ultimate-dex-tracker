import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export default function DeleteBackupModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  backupData 
}) {
  const pokemonCount = Object.keys(backupData?.data?.caught || backupData?.data || {}).length;
  const backupUsername = backupData?.user?.username || 'unknown user';
  const backupDate = new Date(backupData?.backupDate || backupData?.exportDate).toLocaleString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Backup"
      subtitle="This action cannot be undone"
      icon={<Trash2 size={22} className="text-red-400" />}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} icon={<Trash2 size={16} />}>
            Delete Backup
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm" style={{ color: 'var(--text)' }}>
        <p>
          Are you sure you want to delete this backup?
        </p>

        <div 
          className="p-3.5 rounded-xl space-y-1.5"
          style={{ 
            backgroundColor: 'var(--pokemon-box-bg2, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-color)'
          }}
        >
          <div className="font-semibold text-xs uppercase tracking-wider text-[var(--accent)] mb-1">Backup Details</div>
          <div>• <strong>Pokémon Count:</strong> {pokemonCount}</div>
          <div>• <strong>Created by:</strong> {backupUsername}</div>
          <div>• <strong>Date:</strong> {backupDate}</div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>This will permanently remove the backup from local storage. The backup data will be lost forever.</span>
        </div>
      </div>
    </Modal>
  );
}
