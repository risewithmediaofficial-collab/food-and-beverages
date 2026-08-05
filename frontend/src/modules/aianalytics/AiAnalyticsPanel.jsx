import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function AiAnalyticsPanel() {
  const [insights] = useState([
    { id: '1', title: 'Alphonso Mango Concentrate Demand Forecast', desc: 'Predictive model forecasts a 35% demand surge for Alphonso Mango 500ml over the next 14 days due to summer hospitality orders.', confidence: '94% Confidence', type: 'Demand Forecast', icon: 'mdi:trending-up', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: '2', title: 'Bottling Line #1 Predictive Maintenance Alert', desc: 'Vibration frequency anomaly detected on Filling Nozzle Valve #3. Schedule preventive maintenance in 48 hours to avoid unplanned downtime.', confidence: '89% Confidence', type: 'Maintenance Alert', icon: 'mdi:alert-decagram-outline', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: '3', title: 'Raw Material Reorder Optimization', desc: 'Current PET Bottle 500ml stock will drop below safety threshold in 5 days based on active production schedules. Reorder 15,000 units.', confidence: '98% Confidence', type: 'Stock Forecast', icon: 'mdi:package-variant', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:brain" className="text-orange-500 text-lg" /> AI Predictive Analytics & Intelligence
          </h2>
          <p className="text-xs text-slate-400">Machine learning demand forecasting, predictive maintenance, and raw material optimization suggestions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl border ${item.color}`}>
                  <Icon icon={item.icon} className="text-xl" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {item.confidence}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block">{item.type}</span>
              <h3 className="font-bold text-slate-900 text-sm mt-1">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>

            <button className="w-full mt-4 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer">
              <span>Apply AI Suggestion</span>
              <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
