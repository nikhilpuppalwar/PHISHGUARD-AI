import React from 'react';
import { getBreadcrumbTrail } from '../navigation';

export default function PageHeader({
  screenId,
  eyebrow,
  title,
  description,
  breadcrumbs,
  onNavigate,
  children
}) {
  const trail = breadcrumbs || (screenId ? getBreadcrumbTrail(screenId) : []);

  return (
    <header className="space-y-2 mb-6">
      {/* Subtle Breadcrumb Trail */}
      {trail && trail.length > 0 && (
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {trail.map((crumb, idx) => {
            const isLast = idx === trail.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-slate-400 select-none">/</span>
                )}
                {crumb.screen && onNavigate && !isLast ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(crumb.screen)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={isLast ? 'text-slate-800 font-semibold' : 'text-slate-500'}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Title Row & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {eyebrow && (
            <div className="text-[11px] font-mono font-semibold tracking-wider text-blue-700 uppercase">
              {eyebrow}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
