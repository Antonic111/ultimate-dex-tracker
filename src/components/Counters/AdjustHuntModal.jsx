import React, { useState, useEffect } from "react";
import { Modal, Button, NumberField } from "../Shared";
import { Sliders, Check } from "lucide-react";

const formatPokemonName = (name) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export default function AdjustHuntModal({
  isOpen,
  onClose,
  hunt,
  huntIncrements = {},
  onSaveAdjustments
}) {
  const [settingsForm, setSettingsForm] = useState({
    manualChecks: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    manualIncrements: 1
  });

  useEffect(() => {
    if (hunt && isOpen) {
      const elapsedMs = hunt.elapsedMs || 0;
      const totalSec = Math.floor(elapsedMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const currentInc =
        huntIncrements[hunt.id] ||
        huntIncrements[String(hunt.id)] ||
        hunt.increment ||
        1;

      setSettingsForm({
        manualChecks: hunt.checks || 0,
        hours: h,
        minutes: m,
        seconds: s,
        manualIncrements: currentInc
      });
    }
  }, [hunt, isOpen, huntIncrements]);

  if (!hunt) return null;

  const handleSave = () => {
    const newChecks = Math.max(0, parseInt(settingsForm.manualChecks, 10) || 0);
    const h = Math.max(0, parseInt(settingsForm.hours, 10) || 0);
    const m = Math.max(0, parseInt(settingsForm.minutes, 10) || 0);
    const s = Math.max(0, parseInt(settingsForm.seconds, 10) || 0);
    const newTotalMs = (h * 3600 + m * 60 + s) * 1000;
    const newIncrement = Math.max(1, parseInt(settingsForm.manualIncrements, 10) || 1);

    if (onSaveAdjustments) {
      onSaveAdjustments(hunt.id, {
        checks: newChecks,
        increment: newIncrement,
        overrideElapsedMs: newTotalMs
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Hunt Values & Timer"
      subtitle={`Manually override encounters, time & increment for Shiny ${formatPokemonName(hunt.pokemon?.name)}`}
      icon={<Sliders size={22} />}
      size="md"
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Check size={16} strokeWidth={2.5} />}
          >
            Save Adjustments
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <NumberField
          label="Total Encounters (Checks)"
          value={settingsForm.manualChecks ?? ""}
          onChange={(e) => {
            const val = e?.target?.value !== undefined ? e.target.value : e;
            setSettingsForm(prev => ({ ...prev, manualChecks: val }));
          }}
          min={0}
          fullWidth
        />

        <div>
          <label className="hunt-modal-label">Elapsed Time</label>
          <div className="grid grid-cols-3 gap-3 mt-1.5">
            <NumberField
              label="Hours"
              value={settingsForm.hours ?? ""}
              onChange={(e) => {
                const val = e?.target?.value !== undefined ? e.target.value : e;
                setSettingsForm(prev => ({ ...prev, hours: val }));
              }}
              min={0}
              fullWidth
            />
            <NumberField
              label="Minutes"
              value={settingsForm.minutes ?? ""}
              onChange={(e) => {
                const val = e?.target?.value !== undefined ? e.target.value : e;
                setSettingsForm(prev => ({ ...prev, minutes: val }));
              }}
              min={0}
              max={59}
              fullWidth
            />
            <NumberField
              label="Seconds"
              value={settingsForm.seconds ?? ""}
              onChange={(e) => {
                const val = e?.target?.value !== undefined ? e.target.value : e;
                setSettingsForm(prev => ({ ...prev, seconds: val }));
              }}
              min={0}
              max={59}
              fullWidth
            />
          </div>
        </div>

        <NumberField
          label="Count Increment (+ / − Step Size)"
          value={settingsForm.manualIncrements ?? ""}
          onChange={(e) => {
            const val = e?.target?.value !== undefined ? e.target.value : e;
            setSettingsForm(prev => ({ ...prev, manualIncrements: val }));
          }}
          min={1}
          fullWidth
        />
      </div>
    </Modal>
  );
}
