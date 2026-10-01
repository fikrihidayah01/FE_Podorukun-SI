import type { ReactNode } from 'react';
import { PiInfo, PiWarning, PiWarningCircle, PiCheckCircle } from 'react-icons/pi';

type NoticeTone = 'info' | 'warning' | 'danger' | 'positive';

const STYLE: Record<NoticeTone, { box: string; icon: string; Icon: typeof PiInfo }> = {
  info: { box: 'bg-brand-50 text-ink-2 border-brand-100', icon: 'text-brand-600', Icon: PiInfo },
  warning: { box: 'bg-warning-soft text-[#5c3300] border-[#f3dcae]', icon: 'text-warning', Icon: PiWarning },
  danger: { box: 'bg-danger-soft text-[#7a1810] border-[#f6c9c3]', icon: 'text-danger', Icon: PiWarningCircle },
  positive: { box: 'bg-positive-soft text-[#0a4a30] border-[#bfe3cd]', icon: 'text-positive', Icon: PiCheckCircle },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Pesan kontekstual di dalam halaman. Ikon + teks, tidak pernah warna saja. */
export default function Notice({ tone = 'info', title, children, action, className = '' }: NoticeProps) {
  const s = STYLE[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm ${s.box} ${className}`}
    >
      <s.Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${s.icon}`} aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
