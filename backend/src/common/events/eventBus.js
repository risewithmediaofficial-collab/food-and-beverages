import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

export const eventBus = new AppEventBus();

export const EVENTS = {
  LEAD_CREATED: 'crm.lead.created',
  SALES_ORDER_CREATED: 'sales.order.created',
  SALES_ORDER_STATUS_CHANGED: 'sales.order.status_changed',
  INVOICE_GENERATED: 'sales.invoice.generated',
  PAYMENT_RECEIVED: 'sales.payment.received',
  STOCK_IN: 'inventory.stock.in',
  STOCK_OUT: 'inventory.stock.out',
  LOW_STOCK_ALERT: 'inventory.low_stock',
  PO_CREATED: 'purchase.po.created',
  GRN_RECEIVED: 'purchase.grn.received',
  PRODUCTION_ORDER_CREATED: 'production.order.created',
  PRODUCTION_ORDER_STARTED: 'production.order.started',
  PRODUCTION_ORDER_COMPLETED: 'production.order.completed',
  PRODUCTION_ORDER_REJECTED: 'production.order.rejected',
  MACHINE_STATUS_CHANGED: 'machine.status.changed',
  MACHINE_LOG_UPDATED: 'machine.log.updated',
  QC_COMPLETED: 'qc.check.completed',
  DISPATCH_CREATED: 'dispatch.created',
  DISPATCH_DELIVERED: 'dispatch.delivered',
  NOTIFICATION_EMITTED: 'notification.emitted',
};
