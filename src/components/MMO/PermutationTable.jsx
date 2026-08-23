import { useState, useMemo } from "react";
import { RotateCcw } from "lucide-react";
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

  const toggleComplete = (rowKey) => {
    const globalKey = `${title}-${rowKey}`;
    const isNowDone = !globalChartData[globalKey];
    if (onChartCheck) onChartCheck(isNowDone);
    if (onChartUpdate) onChartUpdate({ ...globalChartData, [globalKey]: isNowDone });
  };

  const maxCols = useMemo(() => {
    if (!rows || rows.length === 0) return spawnCount === "All" ? 4 : spawnCount;
    return Math.max(...rows.map(r => r.length));
  }, [rows, spawnCount]);

  const lockedCatchCount = useMemo(() => {
    if (!isSaveOrder) return 0;
    
    const uncompletedRows = rows.filter(r => !globalChartData[`${title}-${r.join('-')}`]);
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
    <div className="perm-table-outer" style={{ marginBottom: '2rem' }}>
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
              const isDone = !!globalChartData[`${title}-${rowKey}`];
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
                  >
                    <button
                      className={`perm-check-btn${isDone ? " perm-check-btn-done" : ""}`}
                      title={isDone ? "Mark incomplete" : "Mark complete"}
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

      <div className="perm-reset-wrap">
        {!readOnly && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowResetModal(true)}
            icon={<RotateCcw size={15} />}
          >
            Reset Chart
          </Button>
        )}
      </div>

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
  const firstSpawn = chartConfig.firstSpawn ?? 8;
  const secondSpawn = chartConfig.secondSpawn ?? 6;
  const isAdvanced = chartConfig.isAdvanced ?? false;
  const isSaveOrder = chartConfig.isSaveOrder ?? false;
  const showSecondWave = chartConfig.showSecondWave ?? false;
  const showGhostChecks = chartConfig.showGhostChecks ?? false;

  const setConfig = (key, val) => {
    if (onChartConfigUpdate) {
      onChartConfigUpdate({ ...chartConfig, [key]: val });
    }
  };

  const combinedGhostData = [
    ...(GHOST_PERMUTATION_DATA[4] || [])
  ];

  return (
    <div className={`perm-wrapper${readOnly ? " perm-readonly" : ""}`}>

      {/* ✨ Global Legend ✨ */}
      <div className="perm-legend" style={{ marginBottom: '2rem', justifyContent: 'center' }}>
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

      {/* Wave counts display and chart checks summary */}
      {readOnly && (
        <div className="perm-read-only-config" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--progressbar-info)', fontWeight: 600 }}>
          <span>First Wave: <strong style={{ color: 'var(--accent)' }}>{firstSpawn}</strong> Spawns</span>
          {showSecondWave && (
            <span>Second Wave: <strong style={{ color: 'var(--accent)' }}>{secondSpawn}</strong> Spawns</span>
          )}
          <span>Chart Checks: <strong style={{ color: 'var(--accent)' }}>{Object.values(chartData).filter(Boolean).length * secondSpawn}</strong> ({Object.values(chartData).filter(Boolean).length} runs)</span>
        </div>
      )}

      {/* ── Unified Config Bar ─────────────────────────────────────────── */}
      {!readOnly && (
        <div className="perm-config-bar" style={{ marginBottom: '2rem' }}>
          <div className="perm-config-left">
            
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              
              {/* First Wave Config */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <span className="perm-config-title">First Wave Configuration</span>
                <span className="perm-config-sub">Select the Number of Spawns</span>
                <div className="flex items-center gap-2">
                  {[8, 9, 10].map(n => (
                    <Button
                      key={n}
                      variant={firstSpawn === n ? "primary" : "secondary"}
                      size="sm"
                      className="min-w-[44px] h-[36px] font-bold"
                      onClick={() => setConfig('firstSpawn', n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Second Wave Config */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <span className="perm-config-title">Second Wave Configuration</span>
                <span className="perm-config-sub">Select the Number of Spawns</span>
                <div className="flex items-center gap-2">
                  {[6, 7].map(n => (
                    <Button
                      key={n}
                      variant={secondSpawn === n ? "primary" : "secondary"}
                      size="sm"
                      className="min-w-[44px] h-[36px] font-bold"
                      onClick={() => setConfig('secondSpawn', n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="perm-switch-wrap bg-transparent border-0 cursor-pointer p-0 select-none text-left"
                onClick={() => setConfig('isAdvanced', !isAdvanced)}
              >
                <span className={`perm-switch ${isAdvanced ? 'active' : ''}`} />
                <span>Advanced Mode</span>
              </button>

              <button
                type="button"
                className="perm-switch-wrap bg-transparent border-0 cursor-pointer p-0 select-none text-left"
                onClick={() => setConfig('isSaveOrder', !isSaveOrder)}
              >
                <span className={`perm-switch ${isSaveOrder ? 'active' : ''}`} />
                <span>Save Order</span>
              </button>

              <button
                type="button"
                className="perm-switch-wrap bg-transparent border-0 cursor-pointer p-0 select-none text-left"
                onClick={() => setConfig('showSecondWave', !showSecondWave)}
              >
                <span className={`perm-switch ${showSecondWave ? 'active' : ''}`} />
                <span>Second Wave</span>
              </button>

              <button
                type="button"
                className="perm-switch-wrap bg-transparent border-0 cursor-pointer p-0 select-none text-left"
                onClick={() => setConfig('showGhostChecks', !showGhostChecks)}
              >
                <span className={`perm-switch ${showGhostChecks ? 'active' : ''}`} />
                <span>Ghost Checks</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Grids ───────────────────────────────────────────────────────── */}
      <PermutationGrid 
        title="Main Permutations"
        spawnCount={firstSpawn}
        isAdvanced={isAdvanced}
        isSaveOrder={isSaveOrder}
        dataObj={PERMUTATION_DATA}
        advancedDataObj={ADVANCED_PERMUTATION_DATA}
        supportsAdvanced={true}
        globalChartData={chartData}
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
          globalChartData={chartData}
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
          globalChartData={chartData}
          onChartUpdate={onChartUpdate}
          onChartCheck={onChartCheck}
          legendColors={legendColors}
          readOnly={readOnly}
        />
      )}

    </div>
  );
}
