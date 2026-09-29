import React, { useState } from 'react';

/**
 * OriginalSubmittedContent Component (Spec §3, §18)
 * Prominently and safely displays the exact original user input without alteration.
 * Features safe string rendering, copy-to-clipboard, expand/collapse for long content,
 * and key metadata badges (channel, sender, subject, extracted URLs).
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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[17px]">description</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Original Submitted Content</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-200/70 text-slate-700">
                Preserved Raw Input
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Unaltered content as submitted for forensic evaluation. Safe sandboxed rendering.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-md transition"
            >
              <span className="material-symbols-outlined text-[15px]">
                {expanded ? 'unfold_less' : 'unfold_more'}
              </span>
              <span>{expanded ? 'Show Less' : 'Expand Full'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs transition active:scale-95"
            title="Copy original submission to clipboard"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-500">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Overview Pills */}
      {(sender || subject || (extractedUrls && extractedUrls.length > 0) || channel) && (
        <div className="px-5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
            <span className="text-slate-400 font-sans">Channel:</span> {channel.toUpperCase()}
          </span>

          {sender && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
              <span className="text-slate-400 font-sans">Sender:</span> {sender}
            </span>
          )}

          {subject && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] truncate max-w-xs">
              <span className="text-slate-400 font-sans">Subject:</span> {subject}
            </span>
          )}

          {extractedUrls && extractedUrls.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-100">
              <span className="material-symbols-outlined text-[12px]">link</span>
              {extractedUrls.length} extracted URL{extractedUrls.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Sandboxed Monospace Content */}
      <div className="p-5 bg-slate-900/95 overflow-x-auto relative">
        <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-all select-all font-normal">
          {displayText}
        </pre>

        {isLong && !expanded && (
          <div className="mt-3 pt-2 border-t border-slate-800 text-center">
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1"
            >
              <span>+ {cleanContent.length - 320} more characters hidden. Click to view all.</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
