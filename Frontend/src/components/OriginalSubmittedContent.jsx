import React, { useState } from 'react';

/**
 * OriginalSubmittedContent Component (Spec §6, §18)
 * "YOUR SUBMITTED CONTENT"
 * Subtitle: "This is the content you asked PhishGuard AI to analyze."
 * Features:
 * - Safely sandboxed monospace preformatted display
 * - Line breaks preserved
 * - Links rendered inert (non-clickable) to prevent accidental execution
 * - Copy button with visual feedback
 * - Expand / Collapse toggle for long submissions
 * - Channel, sender, subject, and extracted URL metadata badges
 */
export default function OriginalSubmittedContent({
  content = '',
  channel = 'email',
  sender = null,
  subject = null,
  extractedUrls = []
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cleanContent = content || 'No input content recorded.';
  const isLong = cleanContent.length > 350 || (cleanContent.match(/\n/g) || []).length > 8;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const displayText = (!expanded && isLong)
    ? cleanContent.slice(0, 320) + '...'
    : cleanContent;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[19px]">description</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                YOUR SUBMITTED CONTENT
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                Sandboxed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              This is the content you asked PhishGuard AI to analyze.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            >
              <span className="material-symbols-outlined text-[16px]">
                {expanded ? 'unfold_less' : 'unfold_more'}
              </span>
              <span>{expanded ? 'Show Less' : 'Expand Full'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition active:scale-95"
            title="Copy original submission to clipboard"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Overview Pills */}
      <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-mono text-xs">
          <span className="text-slate-500 font-sans font-medium">Channel:</span> <strong className="font-semibold">{channel.toUpperCase()}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-mono text-xs">
          <span className="text-slate-500 font-sans font-medium">Sender:</span> <strong className="font-semibold">{sender || 'Not provided'}</strong>
        </span>

        {subject && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs truncate max-w-sm">
            <span className="text-slate-500 font-sans font-medium">Subject:</span> <strong className="font-semibold">{subject}</strong>
          </span>
        )}

        {extractedUrls && extractedUrls.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-mono text-xs border border-blue-200">
            <span className="material-symbols-outlined text-[14px]">link</span>
            <strong>{extractedUrls.length} extracted link{extractedUrls.length > 1 ? 's' : ''}</strong>
          </span>
        )}
      </div>

      {/* Sandboxed Monospace Content */}
      <div className="p-6 bg-[#0B1220] overflow-x-auto relative">
        <pre className="font-mono text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap break-words select-all font-normal">
          {displayText}
        </pre>

        {isLong && !expanded && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono font-medium inline-flex items-center gap-1.5"
            >
              <span>+ {cleanContent.length - 320} more characters hidden. Click to expand full text.</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
