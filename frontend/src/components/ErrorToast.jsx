import { Icon } from '@iconify/react';

export default function ErrorToast({ message, type = 'error', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold font-sans ${
        type === 'error'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}>
        <Icon icon={type === 'error' ? 'mdi:alert-circle-outline' : type === 'success' ? 'mdi:check-circle-outline' : 'mdi:information-outline'} className="text-lg flex-shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-700 ml-2">
          <Icon icon="mdi:close" className="text-base" />
        </button>
      </div>
    </div>
  );
}
