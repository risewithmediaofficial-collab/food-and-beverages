import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const PIPELINE_STAGES = [
  { id: 'planning', label: '1. Planning', path: '/planning', icon: 'mdi:calendar-clock', desc: 'Schedule & Capacity' },
  { id: 'production', label: '2. Production', path: '/production', icon: 'mdi:factory', desc: 'Batch Processing' },
  { id: 'quality', label: '3. Quality QC', path: '/quality', icon: 'mdi:check-decagram', desc: 'Physical & Brix Checks' },
  { id: 'laboratory', label: '4. Lab & COA', path: '/laboratory', icon: 'mdi:microscope', desc: 'Microbiology & Release' },
  { id: 'packaging', label: '5. Packaging', path: '/packaging', icon: 'mdi:box-seal', desc: 'Bottling & Cartons' },
  { id: 'dispatch', label: '6. Dispatch', path: '/dispatch', icon: 'mdi:truck-fast', desc: 'Logistics & Delivery' },
];

export default function ManufacturingPipelineBar({ currentStage = 'planning' }) {
  const navigate = useNavigate();

  const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">
            End-to-End Manufacturing Workflow Pipeline
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
          Stage {currentIndex + 1} of {PIPELINE_STAGES.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCurrent = stage.id === currentStage;
          const isCompleted = idx < currentIndex;
          const isPending = idx > currentIndex;

          let cardStyle = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/80';
          let badgeStyle = 'bg-slate-200 text-slate-600';
          let iconColor = 'text-slate-400';

          if (isCurrent) {
            cardStyle = 'bg-orange-50/80 border-orange-400 text-orange-950 shadow-sm ring-2 ring-orange-400/20';
            badgeStyle = 'bg-orange-500 text-white font-bold animate-pulse';
            iconColor = 'text-orange-600';
          } else if (isCompleted) {
            cardStyle = 'bg-emerald-50/60 border-emerald-300 text-emerald-900 hover:bg-emerald-50';
            badgeStyle = 'bg-emerald-600 text-white font-bold';
            iconColor = 'text-emerald-600';
          }

          return (
            <button
              key={stage.id}
              onClick={() => navigate(stage.path)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${cardStyle}`}
              title={`Go to ${stage.label}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon icon={stage.icon} className={`text-base ${iconColor}`} />
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${badgeStyle}`}>
                  {isCompleted ? '✓ Done' : isCurrent ? '⚡ Active' : `Step ${idx + 1}`}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold block truncate">{stage.label}</span>
                <span className="text-[10px] text-slate-400 block truncate group-hover:text-slate-600">
                  {stage.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
