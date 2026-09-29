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
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[19px]">description</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Original Submitted Content</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-200/80 text-slate-700">
                Preserved Raw Input
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Unaltered content as submitted for forensic evaluation. Safe sandboxed rendering.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition"
            >
              <span className="material-symbols-outlined text-[16px]">
                {expanded ? 'unfold_less' : 'unfold_more'}
              </span>
              <span>{expanded ? 'Show Less' : 'Expand Full'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs transition active:scale-95"
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
      {(sender || subject || (extractedUrls && extractedUrls.length > 0) || channel) && (
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-mono text-xs">
            <span className="text-slate-500 font-sans font-medium">Channel:</span> <strong className="font-semibold">{channel.toUpperCase()}</strong>
          </span>

          {sender && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-mono text-xs">
              <span className="text-slate-500 font-sans font-medium">Sender:</span> <strong className="font-semibold">{sender}</strong>
            </span>
          )}

          {subject && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs truncate max-w-sm">
              <span className="text-slate-500 font-sans font-medium">Subject:</span> <strong className="font-semibold">{subject}</strong>
            </span>
          )}

          {extractedUrls && extractedUrls.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-mono text-xs border border-blue-200">
              <span className="material-symbols-outlined text-[14px]">link</span>
              <strong>{extractedUrls.length} extracted URL{extractedUrls.length > 1 ? 's' : ''}</strong>
            </span>
          )}
        </div>
      )}

      {/* Sandboxed Monospace Content */}
      <div className="p-6 bg-[#0B1220] overflow-x-auto relative">
        <pre className="font-mono text-sm text-slate-100 leading-relaxed whitespace-pre-wrap break-words select-all font-normal">
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
