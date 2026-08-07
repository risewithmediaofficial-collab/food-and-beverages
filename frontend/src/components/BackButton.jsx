import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ to = '/settings', label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded transition-colors duration-150"
      aria-label="Go back"
    >
      <Icon icon="mdi:arrow-left" className="text-base" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
