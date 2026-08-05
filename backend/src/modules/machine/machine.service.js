import { Machine, MachineLog } from './machine.model.js';
import { calcOEE } from '../../common/utils/calcOEE.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';

export const machineService = {
  async logEvent({ machineId, type, note, productionOrderId, qtyProduced = 0, targetQty = 1000 }) {
    const machine = await Machine.findById(machineId);
    if (!machine) throw new Error('Machine not found');

    const statusMap = {
      start: 'running',
      running: 'running',
      idle: 'idle',
      cleaning: 'idle',
      breakdown: 'breakdown',
      maintenance: 'maintenance',
      stop: 'idle',
    };

    const now = new Date();

    if (type === 'start') {
      machine.currentStatus = 'running';
      machine.startedAt = now;
    } else if (type === 'stop' || type === 'breakdown' || type === 'idle') {
      machine.currentStatus = statusMap[type] || 'idle';
      machine.stoppedAt = now;
      if (machine.startedAt) {
        const elapsedMin = Math.max(1, Math.round((now - new Date(machine.startedAt)) / (1000 * 60)));
        machine.lastRunDurationMinutes = elapsedMin;
        machine.totalRunMinutes = (machine.totalRunMinutes || 0) + elapsedMin;
      }
    } else if (statusMap[type]) {
      machine.currentStatus = statusMap[type];
    }

    await machine.save();

    let log = await MachineLog.findOne({
      machineId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!log) {
      log = new MachineLog({
        factoryId: machine.factoryId,
        machineId,
        productionOrderId,
        events: [],
      });
    }

    log.events.push({ type, timestamp: now, note });
    if (qtyProduced) log.computed.qtyProduced = qtyProduced;
    if (targetQty) log.computed.targetQty = targetQty;
    log.computed.runtimeMin = machine.totalRunMinutes || 0;

    const oeeMetrics = calcOEE({
      events: log.events,
      qtyProduced: log.computed.qtyProduced,
      targetQty: log.computed.targetQty,
      goodQty: Math.round(log.computed.qtyProduced * 0.98),
      idealRateUnitsPerMin: machine.capacityUnitsPerHour / 60,
    });

    log.computed = { ...log.computed, ...oeeMetrics };
    await log.save();

    eventBus.emit(EVENTS.MACHINE_STATUS_CHANGED, { machineId, status: machine.currentStatus, oee: oeeMetrics.oeePct });
    getIO().emit('machine:status-changed', {
      machineId,
      status: machine.currentStatus,
      oee: oeeMetrics.oeePct,
      machineName: machine.name,
      startedAt: machine.startedAt,
      stoppedAt: machine.stoppedAt,
      lastRunDurationMinutes: machine.lastRunDurationMinutes,
      totalRunMinutes: machine.totalRunMinutes,
    });

    return { machine, log };
  }
};
