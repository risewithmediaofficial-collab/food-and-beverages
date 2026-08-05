export const calcOEE = ({
  events = [],
  qtyProduced = 0,
  targetQty = 0,
  goodQty = 0,
  idealRateUnitsPerMin = 100,
  plannedTimeMin = 480
}) => {
  let runtimeMin = 0;
  let idleMin = 0;
  let breakdownMin = 0;
  let cleaningMin = 0;
  let maintenanceMin = 0;

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    const next = events[i + 1];
    if (!next) continue;

    const durationMs = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
    const durationMin = Math.max(0, durationMs / (1000 * 60));

    switch (current.type) {
      case 'running':
        runtimeMin += durationMin;
        break;
      case 'idle':
        idleMin += durationMin;
        break;
      case 'breakdown':
        breakdownMin += durationMin;
        break;
      case 'cleaning':
        cleaningMin += durationMin;
        break;
      case 'maintenance':
        maintenanceMin += durationMin;
        break;
      default:
        break;
    }
  }

  if (events.length === 0 && qtyProduced > 0) {
    runtimeMin = 360;
    idleMin = 60;
    breakdownMin = 30;
    cleaningMin = 30;
  }

  const operatingTimeMin = runtimeMin;
  const plannedOperatingTime = Math.max(1, plannedTimeMin - maintenanceMin);

  const availability = Math.min(1, Math.max(0, operatingTimeMin / plannedOperatingTime));
  const maxPossibleOutput = Math.max(1, operatingTimeMin * idealRateUnitsPerMin);
  const performance = Math.min(1, Math.max(0, qtyProduced / maxPossibleOutput));
  const quality = qtyProduced > 0 ? Math.min(1, Math.max(0, (goodQty || qtyProduced) / qtyProduced)) : 1;

  const oeePct = Math.round(availability * performance * quality * 100 * 10) / 10;
  const efficiencyPct = targetQty > 0 ? Math.min(100, Math.round((qtyProduced / targetQty) * 100 * 10) / 10) : 0;

  return {
    runtimeMin: Math.round(runtimeMin),
    idleMin: Math.round(idleMin),
    breakdownMin: Math.round(breakdownMin),
    cleaningMin: Math.round(cleaningMin),
    maintenanceMin: Math.round(maintenanceMin),
    availabilityPct: Math.round(availability * 100 * 10) / 10,
    performancePct: Math.round(performance * 100 * 10) / 10,
    qualityPct: Math.round(quality * 100 * 10) / 10,
    efficiencyPct,
    oeePct,
  };
};
