import React from "react";
import { Database, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export default function RestoreBackupModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  backupData, 
  username 
}) {
  const pokemonCount = Object.keys(backupData?.data?.caught || backupData?.data || {}).length;
  const backupUsername = backupData?.user?.username || 'unknown user';
  const isDifferentUser = backupUsername !== username;
  const backupDate = new Date(backupData?.backupDate || backupData?.exportDate).toLocaleString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore Backup"
      subtitle="Overwrite your current Pokémon collection with backup data"
      icon={<Database size={22} />}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} icon={<Database size={16} />}>
            Restore Backup
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm" style={{ color: 'var(--text)' }}>
        <p>
          Are you sure you want to restore this backup? This will overwrite your current Pokémon data.
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

        {isDifferentUser && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs leading-relaxed">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <span>This backup was created by "{backupUsername}" but you are logged in as "{username}".</span>
          </div>
        )}

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>This action cannot be undone. Your current data will be permanently replaced.</span>
        </div>
      </div>
    </Modal>
  );
}
