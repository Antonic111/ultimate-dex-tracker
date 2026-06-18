import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { RotateCcw } from "lucide-react";
import { PERMUTATION_DATA, ADVANCED_PERMUTATION_DATA, GHOST_PERMUTATION_DATA } from "../../data/permutations";
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
  const [resetModalClosing, setResetModalClosing] = useState(false);

  useEffect(() => {
    if (showResetModal) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => { 
      document.documentElement.style.overflow = '';
      document.body.style.overflow = ''; 
    };
  }, [showResetModal]);

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
        {!readOnly && <button 
          className="perm-reset-btn" 
          onClick={() => setShowResetModal(true)}
          title="Uncheck all rows in this chart"
          style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}
        >
          <RotateCcw className="w-4 h-4" />
          Reset Chart
        </button>}
      </div>

      {showResetModal && createPortal(
        <div className={`fixed inset-0 z-[20000] ${resetModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}>
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resetModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Reset Chart</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to reset all permutations for <span className="font-semibold text-[var(--accent)]">{title}</span>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setResetModalClosing(true);
                    setTimeout(() => {
                      setShowResetModal(false);
                      setResetModalClosing(false);
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
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
                    setResetModalClosing(true);
                    setTimeout(() => {
                      setShowResetModal(false);
                      setResetModalClosing(false);
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
                >
                  Reset Chart
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
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
  const showSecondWave = chartConfig.showSecondWave ?? true;
  const showGhostChecks = chartConfig.showGhostChecks ?? true;

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
              className="perm-reset-colors-btn hover:text-[var(--text)] transition-colors" 
              onClick={() => setLegendColors && setLegendColors({})}
              title="Reset Colors to Default"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid var(--border-color)', color: 'inherit', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              <RotateCcw className="w-3 h-3" />
              Reset Colors
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
      {!readOnly && <div className="perm-config-bar" style={{ marginBottom: '2rem' }}>
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
                    className={`perm-spawn-btn${firstSpawn === n ? " active" : ""}`}
                    onClick={() => setConfig('firstSpawn', n)}
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
                    className={`perm-spawn-btn${secondSpawn === n ? " active" : ""}`}
                    onClick={() => setConfig('secondSpawn', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <label className="perm-switch-wrap">
              <input 
                type="checkbox" 
                style={{ display: 'none' }}
                checked={isAdvanced}
                onChange={(e) => setConfig('isAdvanced', e.target.checked)}
              />
              <span className={`perm-switch ${isAdvanced ? 'active' : ''}`} />
              Advanced Mode
            </label>

            <label className="perm-switch-wrap">
              <input 
                type="checkbox" 
                style={{ display: 'none' }}
                checked={isSaveOrder}
                onChange={(e) => setConfig('isSaveOrder', e.target.checked)}
              />
              <span className={`perm-switch ${isSaveOrder ? 'active' : ''}`} />
              Save Order
            </label>

            <label className="perm-switch-wrap">
              <input 
                type="checkbox" 
                style={{ display: 'none' }}
                checked={showSecondWave}
                onChange={(e) => setConfig('showSecondWave', e.target.checked)}
              />
              <span className={`perm-switch ${showSecondWave ? 'active' : ''}`} />
              Second Wave
            </label>

            <label className="perm-switch-wrap">
              <input 
                type="checkbox" 
                style={{ display: 'none' }}
                checked={showGhostChecks}
                onChange={(e) => setConfig('showGhostChecks', e.target.checked)}
              />
              <span className={`perm-switch ${showGhostChecks ? 'active' : ''}`} />
              Ghost Checks
            </label>
          </div>

        </div>
      </div>}

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
