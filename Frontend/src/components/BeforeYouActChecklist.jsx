import React, { useState } from 'react';

/**
 * BeforeYouActChecklist Component (Spec §12, §18)
 * An interactive, operational checklist for users to verify key safeguards
 * before interacting with the message or links.
 */
export default function BeforeYouActChecklist({ items = [] }) {
  const [checkedItems, setCheckedItems] = useState({});

  const defaultItems = [
    "Verify the sender's full email address and domain directly in the email header",
    "Do not click links or scan QR codes provided within the message",
    "Never send money, registration fees, or gift card numbers for opportunities",
    "Verify unexpected requests via an independently verified channel or website"
  ];

  const checklist = (items && items.length > 0) ? items : defaultItems;

  const toggleCheck = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const isComplete = checkedCount === checklist.length && checklist.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-[17px]">checklist_rtl</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Before You Act</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                isComplete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {checkedCount} of {checklist.length} verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Complete these immediate validation checks before taking any action.
            </p>
          </div>
        </div>

        {/* Quick Reset */}
        {checkedCount > 0 && (
          <button
            onClick={() => setCheckedItems({})}
            className="text-[11px] text-slate-500 hover:text-slate-800 transition"
          >
            Reset checklist
          </button>
        )}
      </div>

      {/* Checklist items */}
      <div className="p-5 space-y-2.5">
        {checklist.map((item, idx) => {
          const isChecked = !!checkedItems[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-700'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                isChecked
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {isChecked && (
                  <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                )}
              </div>
              <span className={`text-xs leading-relaxed ${isChecked ? 'line-through text-slate-500' : ''}`}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
          <span>All safety verification checks completed. You are protected from impulsive actions.</span>
        </div>
      )}
    </div>
  );
}
