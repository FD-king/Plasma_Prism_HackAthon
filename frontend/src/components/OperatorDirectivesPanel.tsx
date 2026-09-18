import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Zap,
} from 'lucide-react';
import { StructuredDirective } from '../types/energy';
import { DEFAULT_PRESET_NOTES } from '../data/defaultScenario';

interface OperatorDirectivesPanelProps {
  notes: string[];
  setNotes: (notes: string[]) => void;
  directives: StructuredDirective[];
  onSolve: (forceRefresh?: boolean) => void;
  isSolving: boolean;
  executionTimeMs?: number;
  cacheHit?: boolean;
}

export const OperatorDirectivesPanel: React.FC<OperatorDirectivesPanelProps> = ({
  notes,
  setNotes,
  directives,
  onSolve,
  isSolving,
  executionTimeMs,
  cacheHit,
}) => {
  const [activePreset, setActivePreset] = useState<string>('');

  const handleNoteChange = (index: number, val: string) => {
    const updated = [...notes];
    updated[index] = val;
    setNotes(updated);
  };

  const handleAddNote = () => {
    if (notes.length < 3) {
      setNotes([...notes, '']);
    }
  };

  const handleRemoveNote = (index: number) => {
    if (notes.length > 1) {
      const updated = notes.filter((_, i) => i !== index);
      setNotes(updated);
    }
  };

  const applyPreset = (presetText: string) => {
    if (!notes.includes(presetText)) {
      if (notes.length < 3) {
        setNotes([...notes, presetText]);
      } else {
        const updated = [...notes];
        updated[2] = presetText;
        setNotes(updated);
      }
    }
  };

  return (
    <div
      id="operator-directives-panel"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 my-4 shadow-xl shadow-cyan-950/15"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#172738]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-sm shadow-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              LLM Operator Directives & MILP Optimizer
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Provide 1–3 plain-English operator notes. Gemini 3.8 Flash extracts mathematical constraints, validates feasibility, and dispatches the MILP solver within seconds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="force-refresh-solve-btn"
            onClick={() => onSolve(true)}
            disabled={isSolving}
            title="Bypass Redis cache and re-run solver"
            className="p-2.5 rounded-lg bg-gradient-to-r from-[#122335] to-[#0c1824] text-[#cbd5e1] hover:text-white border border-[#20364d] hover:border-teal-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          <button
            id="solve-milp-primary-btn"
            onClick={() => onSolve(false)}
            disabled={isSolving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 cursor-pointer"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Solving MILP...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Optimize 24h Microgrid</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Quick Chips with Gradient Fills */}
      <div className="my-3.5 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[#94a3b8] font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3 text-teal-400" /> Presets:
        </span>
        {DEFAULT_PRESET_NOTES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(preset)}
            className="text-[11px] px-3 py-1 rounded-full bg-gradient-to-r from-[#0d1c2b] to-[#091522] border border-[#1b364e] hover:border-teal-400 text-teal-200 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            + {preset.split(':')[0]}
          </button>
        ))}
      </div>

      {/* 1–3 Operator Notes Inputs */}
      <div className="flex flex-col gap-2.5 my-3">
        {notes.map((note, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-gradient-to-br from-[#132537] to-[#0d1825] border border-[#1d354d] text-center text-xs font-mono font-bold text-teal-300 flex items-center justify-center shrink-0">
              0{index + 1}
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              placeholder={`Operator note #${index + 1} (e.g. "Keep battery above 60% after 17:00 due to storm alert")`}
              className="flex-1 bg-gradient-to-b from-[#101c2b] to-[#0c1622] border border-[#1d334b] focus:border-teal-400 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#526b84] focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
            />
            {notes.length > 1 && (
              <button
                onClick={() => handleRemoveNote(index)}
                className="p-2 text-[#64748b] hover:text-rose-400 rounded-lg hover:bg-[#152332] transition-colors"
                title="Remove note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {notes.length < 3 && (
          <button
            onClick={handleAddNote}
            className="self-start flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200 px-2 py-1 mt-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add another operator note ({notes.length}/3 max)</span>
          </button>
        )}
      </div>

      {/* Structured Directives Output & Audit Trail */}
      {directives && directives.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#172738]">
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              Converted & Validated Directives ({directives.length})
            </span>
            {executionTimeMs !== undefined && (
              <span className="text-[11px] font-mono text-teal-300 flex items-center gap-1 bg-teal-950/40 px-2.5 py-1 rounded-full border border-teal-800/40">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>Executed in <strong>{executionTimeMs}ms</strong></span>
                {cacheHit && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-teal-400/20 text-teal-300 font-bold text-[10px]">
                    REDIS HIT
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {directives.map((dir, idx) => (
              <div
                key={dir.id || idx}
                className="bg-gradient-to-b from-[#0e1a27] to-[#09121d] border border-[#1b344d] rounded-xl p-3.5 text-xs flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono font-bold text-teal-300 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-950/80 to-cyan-950/80 border border-teal-500/30">
                      {dir.directiveType}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Valid
                    </span>
                  </div>

                  <p className="text-[11px] text-[#cbd5e1] font-medium my-1.5 italic line-clamp-2">
                    "{dir.originalNote}"
                  </p>

                  <div className="text-[11px] text-[#94a3b8] mt-2 flex flex-col gap-0.5 bg-[#070e17] p-2 rounded-lg border border-[#142638]">
                    <div>
                      Hours: <strong className="text-white font-mono">{dir.startHour}:00 - {dir.endHour}:00</strong>
                    </div>
                    <div>
                      Target Constraint: <strong className="text-teal-300 font-mono">{dir.value} {dir.unit}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#142638] text-[10px] text-teal-200/90 leading-relaxed">
                  {dir.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
