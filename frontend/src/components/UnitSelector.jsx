import { useState, useEffect } from 'react';

const STANDARD_UNITS = ['Kg', 'Litre', 'Ml', 'Pcs', 'Bottles', 'Boxes', 'Cans', 'Drums', 'Tons', 'Grams'];

export default function UnitSelector({ value, onChange, className = '', label = 'Unit' }) {
  const isPreset = STANDARD_UNITS.includes(value);
  const [isCustom, setIsCustom] = useState(!isPreset && Boolean(value));
  const [customValue, setCustomValue] = useState(!isPreset ? value : '');

  useEffect(() => {
    if (!STANDARD_UNITS.includes(value) && value !== '') {
      setIsCustom(true);
      setCustomValue(value);
    } else if (STANDARD_UNITS.includes(value)) {
      setIsCustom(false);
    }
  }, [value]);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === 'CUSTOM_UNIT') {
      setIsCustom(true);
      onChange(customValue || 'Unit');
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange(val);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="text-xs text-slate-600 block">{label}</label>}
      <div className="flex gap-1.5">
        <select
          value={isCustom ? 'CUSTOM_UNIT' : (value || 'Kg')}
          onChange={handleSelectChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-medium"
        >
          <option value="Kg">Kg (Kilograms)</option>
          <option value="Litre">Litre (Litres)</option>
          <option value="Ml">Ml (Millilitres)</option>
          <option value="Pcs">Pcs (Pieces)</option>
          <option value="Bottles">Bottles</option>
          <option value="Boxes">Boxes / Cases</option>
          <option value="Cans">Cans / Tins</option>
          <option value="Drums">Drums / Barrels</option>
          <option value="Tons">Tons (Metric Tons)</option>
          <option value="Grams">Grams</option>
          <option value="CUSTOM_UNIT">✏️ Other Custom Unit...</option>
        </select>

        {isCustom && (
          <input
            type="text"
            required
            placeholder="Type Unit (e.g. Pouches)"
            value={customValue}
            onChange={handleCustomChange}
            className="w-full bg-slate-50 border border-blue-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
          />
        )}
      </div>
    </div>
  );
}
