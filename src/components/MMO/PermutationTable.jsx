import { useState, useMemo, useEffect } from "react";
import { RotateCcw, Check } from "lucide-react";
import { PERMUTATION_DATA, ADVANCED_PERMUTATION_DATA, GHOST_PERMUTATION_DATA } from "../../data/permutations";
import { ConfirmModal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import "../../css/PermutationTable.css";

/* ─── colour mapping ──────────────────────────────────────────────────────── */
// Color configuration
const DEFAULT_COLORS = {
  KO1: "#ef4444",
  KO2: "#22c55e",
  KO3: "#3b82f6",
  Leave: "#8b5cf6"
};

function cellColor(value, legendColors = {}) {
  if (value === "C") return null;
  if (value === "Leave") return { bg: legendColors.Leave || DEFAULT_COLORS.Leave, label: "LV" };
  const baseLabel = "KO";
  const bg = legendColors[value] || DEFAULT_COLORS[value] || "#a78bfa";
  return { bg, label: baseLabel };
}

/* ─── single cell ─────────────────────────────────────────────────────────── */
function Cell({ value, isLocked, legendColors }) {
  const ko = cellColor(value, legendColors);
  if (!ko) {
    return (
      <td className={`perm-cell perm-cell-c${isLocked ? ' perm-cell-locked' : ''}`}>
        <span className="perm-c">C</span>
      </td>
    );
  }
  return (
    <td className="perm-cell perm-cell-ko" style={{ "--ko-color": ko.bg }}>
      <span className={`perm-ko ${ko.label === 'LV' ? 'perm-lv' : ''}`} style={{ background: ko.bg }}>{ko.label}</span>
    </td>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function getLeadingCatches(row) {
  let count = 0;
  for (let action of row) {
    if (action === "C") count++;
    else break;
  }
  return count;
}

/* ─── table grid component ────────────────────────────────────────────────── */
function PermutationGrid({
  title, 
  spawnCount, 
  readOnly, 
  dataObj, 
  advancedDataObj,
  isAdvanced,
  isSaveOrder,
  supportsAdvanced,
  onChartCheck,
  globalChartData,
  onChartUpdate,
  legendColors
}) {
  const [showResetModal, setShowResetModal] = useState(false);

  const rows = useMemo(() => {
    const activeDataObj = (supportsAdvanced && isAdvanced && advancedDataObj) ? advancedDataObj : dataObj;
    let baseRows = activeDataObj[spawnCount] || [];
    
    if (isSaveOrder) {
      baseRows = [...baseRows].sort((a, b) => {
        return getLeadingCatches(a) - getLeadingCatches(b);
      });
    }

    return baseRows;
  }, [spawnCount, isAdvanced, isSaveOrder, dataObj, advancedDataObj, supportsAdvanced]);

  const isRowDone = (rowArray) => {
    const rowKey = rowArray.join('-');
    return Boolean(
      globalChartData[`${title}-${rowKey}`] ||
      globalChartData[rowKey]
    );
  };

  const toggleComplete = (rowKey) => {
    if (readOnly) return;
    const globalKey = `${title}-${rowKey}`;
    const currentlyDone = Boolean(globalChartData[globalKey] || globalChartData[rowKey]);
    const isNowDone = !currentlyDone;
    if (onChartCheck) onChartCheck(isNowDone);
    if (onChartUpdate) onChartUpdate({ ...globalChartData, [globalKey]: isNowDone });
  };

  const maxCols = useMemo(() => {
    if (!rows || rows.length === 0) return spawnCount === "All" ? 4 : spawnCount;
    return Math.max(...rows.map(r => r.length));
  }, [rows, spawnCount]);

  const lockedCatchCount = useMemo(() => {
    if (!isSaveOrder) return 0;
    
    const uncompletedRows = rows.filter(r => !isRowDone(r));
    if (uncompletedRows.length === 0) return 0;

    let count = 0;
    for (let c = 0; c < maxCols; c++) {
      if (uncompletedRows.every(r => r[c] === "C")) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [rows, globalChartData, maxCols, isSaveOrder, title]);

  const spawnNumbers = Array.from({ length: maxCols }, (_, i) => i + 1);

  const handleResetConfirm = () => {
    if (onChartUpdate) {
      const newChartData = { ...globalChartData };
      let hasChanges = false;
      for (const key of Object.keys(newChartData)) {
        if (key.startsWith(`${title}-`)) {
          delete newChartData[key];
          hasChanges = true;
        }
      }
      if (hasChanges) onChartUpdate(newChartData);
    }
    setShowResetModal(false);
  };

  return (
    <div className="perm-table-outer">
      <div className="perm-section-header">
        <span className="perm-section-label">{title}</span>
        <span className="perm-section-count">{rows.length} Total</span>
      </div>

      <div className="perm-scroll-wrap">
        <table className="perm-table">
          <thead>
            <tr>
              <th className="perm-th perm-th-order" rowSpan={2}>COUNT</th>
              <th className="perm-th perm-th-spawn" colSpan={maxCols}>Spawn Number</th>
              <th className="perm-th perm-th-complete" rowSpan={2}>Done</th>
            </tr>
            <tr>
              {spawnNumbers.map(n => (
                <th key={n} className="perm-th perm-th-num">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const rowKey = row.join('-');
              const isDone = isRowDone(row);
              return (
                <tr
                  key={rowKey}
                  className={`perm-row${isDone ? " perm-row-done" : ""}${rowIdx % 2 === 1 ? " perm-row-alt" : ""}`}
                >
                  <td className="perm-td-order">{rowIdx + 1}</td>
                  {spawnNumbers.map((_, c) => {
                    const val = row[c];
                    if (!val) {
                      return <td key={`fill-${c}`} className="perm-cell perm-cell-empty"></td>;
                    }
                    return <Cell key={c} value={val} isLocked={c < lockedCatchCount} legendColors={legendColors}
        readOnly={readOnly} />;
                  })}
                  <td 
                    className="perm-td-complete"
                    onClick={() => !readOnly && toggleComplete(rowKey)}
                    style={readOnly ? { cursor: 'default' } : undefined}
                  >
                    <button
                      type="button"
                      className={`perm-check-btn${isDone ? " perm-check-btn-done" : ""}`}
                      title={isDone ? (readOnly ? "Completed" : "Mark incomplete") : (readOnly ? "Incomplete" : "Mark complete")}
                      aria-label={`Row ${rowIdx + 1} ${isDone ? "done" : "not done"}`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 14 14" 
                        fill="none"
                        style={{ 
                          opacity: isDone ? 1 : 0, 
                          transition: 'opacity 0.15s ease' 
                        }}
                      >
                        <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={maxCols + 2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No data available for this configuration.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="perm-reset-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowResetModal(true)}
            icon={<RotateCcw size={15} />}
          >
            Reset Chart
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetConfirm}
        title="Reset Permutation Chart"
        subtitle="This action cannot be undone"
        message={`Are you sure you want to reset all completed rows for ${title}? This will clear your checked progress on this chart.`}
        confirmText="Reset Chart"
        cancelText="Cancel"
        variant="danger"
        confirmDelayMs={500}
      />
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function PermutationTable({ 
  readOnly, 
  chartData = {}, 
  chartConfig = {}, 
  legendColors = {}, 
  setLegendColors,
  onChartUpdate, 
  onChartConfigUpdate, 
  onChartCheck 
}) {
  const stripPrefix = (k) => {
    if (!k || typeof k !== 'string') return k;
    if (k.startsWith('Main Permutations-')) return k.substring(18);
    if (k.startsWith('Second Wave Permutations-')) return k.substring(25);
    if (k.startsWith('Ghost Checks-')) return k.substring(13);
    return k;
  };

  // Normalize chartData to a clean lookup dictionary
  const normalizedChartData = useMemo(() => {
    const result = {};
    if (!chartData) return result;
    if (Array.isArray(chartData)) {
      chartData.forEach(item => {
        if (typeof item === 'string') {
          result[item] = true;
          const stripped = stripPrefix(item);
          if (stripped !== item) result[stripped] = true;
        } else if (item && typeof item === 'object') {
          const k = item.key || item.rowKey || item.id;
          if (k) {
            result[k] = true;
            const stripped = stripPrefix(k);
            if (stripped !== k) result[stripped] = true;
          }
        }
      });
    } else if (typeof chartData === 'object') {
      Object.entries(chartData).forEach(([k, v]) => {
        if (v === true || v === 'true' || v === 1 || v === '1') {
          result[k] = true;
          const stripped = stripPrefix(k);
          if (stripped !== k) result[stripped] = true;
        }
      });
    }
    return result;
  }, [chartData]);

  // Smart configuration detection from chart data
  const inferredConfig = useMemo(() => {
    const cfg = { ...(chartConfig || {}) };
    const keys = Object.keys(normalizedChartData);

    // Auto-detect Ghost Checks
    if (cfg.showGhostChecks === undefined || cfg.showGhostChecks === null) {
      if (keys.some(k => k.startsWith('Ghost Checks-') || k.includes('Leave'))) {
        cfg.showGhostChecks = true;
      }
    }

    // Auto-detect Second Wave
    if (cfg.showSecondWave === undefined || cfg.showSecondWave === null) {
      if (keys.some(k => k.startsWith('Second Wave Permutations-'))) {
        cfg.showSecondWave = true;
      }
    }

    // Auto-detect firstSpawn count (8, 9, 10)
    if (!cfg.firstSpawn) {
      let maxLen = 0;
      keys.forEach(k => {
        if (k.startsWith('Main Permutations-')) {
          const parts = k.replace('Main Permutations-', '').split('-');
          if (parts.length > maxLen) maxLen = parts.length;
        }
      });
      if (maxLen >= 8) cfg.firstSpawn = maxLen;
    }

    // Auto-detect secondSpawn count (6, 7)
    if (!cfg.secondSpawn) {
      let maxSecLen = 0;
      keys.forEach(k => {
        if (k.startsWith('Second Wave Permutations-')) {
          const parts = k.replace('Second Wave Permutations-', '').split('-');
          if (parts.length > maxSecLen) maxSecLen = parts.length;
        }
      });
      if (maxSecLen >= 6) cfg.secondSpawn = maxSecLen;
    }

    // Auto-detect Advanced Mode
    if (cfg.isAdvanced === undefined || cfg.isAdvanced === null) {
      for (const count of [8, 9, 10]) {
        const advRows = ADVANCED_PERMUTATION_DATA[count] || [];
        if (advRows.some(row => keys.some(k => k.endsWith(row.join('-'))))) {
          cfg.isAdvanced = true;
          break;
        }
      }
    }

    return cfg;
  }, [chartConfig, normalizedChartData]);

  // Configuration strictly derived from hunt save in readOnly mode
  const firstSpawn = chartConfig?.firstSpawn ?? inferredConfig.firstSpawn ?? 8;
  const secondSpawn = chartConfig?.secondSpawn ?? inferredConfig.secondSpawn ?? 6;
  const isAdvanced = Boolean(chartConfig?.isAdvanced ?? inferredConfig.isAdvanced ?? false);
  const isSaveOrder = Boolean(chartConfig?.isSaveOrder ?? inferredConfig.isSaveOrder ?? false);
  const showSecondWave = Boolean(chartConfig?.showSecondWave ?? inferredConfig.showSecondWave ?? false);
  const showGhostChecks = Boolean(chartConfig?.showGhostChecks ?? inferredConfig.showGhostChecks ?? false);

  const setConfig = (key, val) => {
    if (readOnly) return; // Completely prevent adjustments in read-only completed hunt mode
    if (onChartConfigUpdate) {
      onChartConfigUpdate({
        ...chartConfig,
        firstSpawn,
        secondSpawn,
        isAdvanced,
        isSaveOrder,
        showSecondWave,
        showGhostChecks,
        [key]: val
      });
    }
  };

  const combinedGhostData = useMemo(() => [
    ...(GHOST_PERMUTATION_DATA[4] || [])
  ], []);


  return (
    <div className={`perm-wrapper${readOnly ? " perm-readonly" : ""}`}>

      {/* ✨ Global Legend ✨ */}
      <div className="perm-legend" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
        {['KO1', 'KO2', 'KO3', 'Leave'].map((key) => {
          const defaultColor = DEFAULT_COLORS[key];
          const currentColor = legendColors[key] || defaultColor;
          const label = key === 'Leave' ? 'LV - Leave' : `KO - Wave ${key.replace('KO', '')}`;
          return (
            <div className="perm-legend-item" key={key}>
              <div className="perm-color-picker-wrap" style={{ background: currentColor }}>
                <input 
                  type="color" 
                  value={currentColor} 
                  disabled={readOnly} 
                  onChange={(e) => {
                    if (setLegendColors) {
                      setLegendColors(prev => ({ ...prev, [key]: e.target.value }));
                    }
                  }}
                  className="perm-color-input"
                />
              </div>
              <span>{label}</span>
            </div>
          );
        })}
        <div className="perm-legend-item">
          <span className="perm-legend-swatch perm-legend-c" />
          <span>C - Catch</span>
        </div>
        {!readOnly && (
          <div className="perm-legend-item" style={{ marginLeft: 'auto', paddingLeft: '1rem' }}>
            <button 
              type="button"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-400 hover:text-[var(--accent)] bg-transparent hover:bg-transparent border-0 shadow-none outline-none transition-colors cursor-pointer" 
              onClick={() => setLegendColors && setLegendColors({})}
              title="Reset Colors to Default"
            >
              <RotateCcw size={13} />
              <span>Reset Colors</span>
            </button>
          </div>
        )}
      </div>


      {/* ── Unified Config Bar (Active in both Edit and ReadOnly modes for inspection) ─────────────────────────────────────────── */}
      <div className="perm-config-bar" style={{ marginBottom: '2rem' }}>
        <div className="perm-config-left">
          
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            
            {/* First Wave Config */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <span className="perm-config-title">First Wave Configuration</span>
              <span className="perm-config-sub">Select the Number of Spawns</span>
              <div className="perm-spawn-btns">
                {[8, 9, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    className={`perm-spawn-btn${firstSpawn === n ? " active" : ""}`}
                    style={readOnly ? { cursor: 'default', pointerEvents: 'none' } : undefined}
                    onClick={() => !readOnly && setConfig('firstSpawn', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Second Wave Config */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <span className="perm-config-title">Second Wave Configuration</span>
              <span className="perm-config-sub">Select the Number of Spawns</span>
              <div className="perm-spawn-btns">
                {[6, 7].map(n => (
                  <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    className={`perm-spawn-btn${secondSpawn === n ? " active" : ""}`}
                    style={readOnly ? { cursor: 'default', pointerEvents: 'none' } : undefined}
                    onClick={() => !readOnly && setConfig('secondSpawn', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div
              className={`perm-switch-wrap${isAdvanced ? " perm-switch-wrap--active" : ""}`}
              style={readOnly ? { cursor: 'default', userSelect: 'none', pointerEvents: 'none' } : undefined}
              onClick={() => !readOnly && setConfig('isAdvanced', !isAdvanced)}
            >
              <span className={`perm-switch ${isAdvanced ? 'active' : ''}`} />
              <span>Advanced Mode</span>
            </div>

            <div
              className={`perm-switch-wrap${isSaveOrder ? " perm-switch-wrap--active" : ""}`}
              style={readOnly ? { cursor: 'default', userSelect: 'none', pointerEvents: 'none' } : undefined}
              onClick={() => !readOnly && setConfig('isSaveOrder', !isSaveOrder)}
            >
              <span className={`perm-switch ${isSaveOrder ? 'active' : ''}`} />
              <span>Save Order</span>
            </div>

            <div
              className={`perm-switch-wrap${showSecondWave ? " perm-switch-wrap--active" : ""}`}
              style={readOnly ? { cursor: 'default', userSelect: 'none', pointerEvents: 'none' } : undefined}
              onClick={() => !readOnly && setConfig('showSecondWave', !showSecondWave)}
            >
              <span className={`perm-switch ${showSecondWave ? 'active' : ''}`} />
              <span>Second Wave</span>
            </div>

            <div
              className={`perm-switch-wrap${showGhostChecks ? " perm-switch-wrap--active" : ""}`}
              style={readOnly ? { cursor: 'default', userSelect: 'none', pointerEvents: 'none' } : undefined}
              onClick={() => !readOnly && setConfig('showGhostChecks', !showGhostChecks)}
            >
              <span className={`perm-switch ${showGhostChecks ? 'active' : ''}`} />
              <span>Ghost Checks</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Grids ───────────────────────────────────────────────────────── */}
      <PermutationGrid 
        title="Main Permutations"
        spawnCount={firstSpawn}
        isAdvanced={isAdvanced}
        isSaveOrder={isSaveOrder}
        dataObj={PERMUTATION_DATA}
        advancedDataObj={ADVANCED_PERMUTATION_DATA}
        supportsAdvanced={true}
        globalChartData={normalizedChartData}
        onChartUpdate={onChartUpdate}
        onChartCheck={onChartCheck}
        legendColors={legendColors}
        readOnly={readOnly}
      />

      {showSecondWave && (
        <PermutationGrid 
          title="Second Wave Permutations"
          spawnCount={secondSpawn}
          isAdvanced={isAdvanced}
          isSaveOrder={isSaveOrder}
          dataObj={PERMUTATION_DATA}
          advancedDataObj={ADVANCED_PERMUTATION_DATA}
          supportsAdvanced={true}
          globalChartData={normalizedChartData}
          onChartUpdate={onChartUpdate}
          onChartCheck={onChartCheck}
          legendColors={legendColors}
          readOnly={readOnly}
        />
      )}

      {showGhostChecks && (
        <PermutationGrid 
          title="Ghost Checks"
          spawnCount={"All"}
          isAdvanced={false}
          isSaveOrder={isSaveOrder}
          dataObj={{ "All": combinedGhostData }}
          supportsAdvanced={false}
          globalChartData={normalizedChartData}
          onChartUpdate={onChartUpdate}
          onChartCheck={onChartCheck}
          legendColors={legendColors}
          readOnly={readOnly}
        />
      )}

    </div>
  );
}

