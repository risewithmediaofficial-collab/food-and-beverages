import { ProductionOrder, Batch } from '../production/production.model.js';
import { SalesOrder, SalesInvoice } from '../sales/sales.model.js';
import { Item, StockBatch } from '../inventory/inventory.model.js';
import { Machine, MachineLog } from '../machine/machine.model.js';
import { Employee } from '../hr/hr.model.js';
import { Lead, Customer } from '../crm/crm.model.js';
import { Supplier, PurchaseOrder } from '../purchase/purchase.model.js';
import { QCCheck } from '../quality/quality.model.js';
import { DispatchOrder } from '../dispatch/dispatch.model.js';
import { getTenantQuery } from '../../common/utils/tenantScope.js';

export const dashboardService = {
  async getOverviewKPIs(req) {
    try {
      // Production
      const activeProductionOrders = await ProductionOrder.countDocuments(getTenantQuery(req, { status: { $in: ['running', 'approved', 'planning', 'quality_testing'] }, isActive: true })) || 0;
      const completedToday = await ProductionOrder.countDocuments(getTenantQuery(req, { status: 'completed', isActive: true })) || 0;
      const totalBatches = await Batch.countDocuments(getTenantQuery(req, { isActive: true })) || 0;

      // Machines & OEE
      const machineLogs = await MachineLog.find(getTenantQuery(req, { isActive: true })).sort({ updatedAt: -1 }).limit(20) || [];
      const avgOEE = machineLogs.length > 0
        ? Math.round(machineLogs.reduce((sum, l) => sum + (l.computed?.oee || 0), 0) / machineLogs.length)
        : 0;
      const runningMachines = await Machine.countDocuments(getTenantQuery(req, { currentStatus: 'running' })) || 0;
      const totalMachines = await Machine.countDocuments(getTenantQuery(req, { isActive: true })) || 0;

      // Sales & Revenue
      const totalSalesOrders = await SalesOrder.countDocuments(getTenantQuery(req, { isActive: true })) || 0;
      const invoices = await SalesInvoice.find(getTenantQuery(req, { isActive: true })) || [];
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const pendingInvoices = await SalesInvoice.countDocuments(getTenantQuery(req, { isActive: true, dueAmount: { $gt: 0 } })) || 0;

      // Inventory & Stock
      const items = await Item.find(getTenantQuery(req, { isActive: true })) || [];
      const batches = await StockBatch.find(getTenantQuery(req, { qty: { $gt: 0 } })) || [];
      let lowStockCount = 0;
      items.forEach((item) => {
        const totalQty = batches
          .filter((b) => b.itemId && item._id && b.itemId.toString() === item._id.toString())
          .reduce((s, b) => s + (b.qty || 0), 0);
        if (item.reorderLevel !== undefined && totalQty <= item.reorderLevel) lowStockCount++;
      });
      const totalItems = items.length;

      // HR
      const totalEmployees = await Employee.countDocuments(getTenantQuery(req, { isActive: true })) || 0;

      // CRM
      const totalLeads = await Lead.countDocuments(getTenantQuery(req, { isActive: true })) || 0;
      const totalCustomers = await Customer.countDocuments(getTenantQuery(req, { isActive: true })) || 0;
      const wonLeads = await Lead.countDocuments(getTenantQuery(req, { isActive: true, status: 'won' })) || 0;

      // Purchase / Suppliers
      const totalSuppliers = await Supplier.countDocuments(getTenantQuery(req, { isActive: true })) || 0;
      const pendingPOs = await PurchaseOrder.countDocuments(getTenantQuery(req, { isActive: true, status: { $in: ['pending', 'ordered', 'sent'] } })) || 0;

      // Quality
      const totalQCChecks = await QCCheck.countDocuments(getTenantQuery(req, { isActive: true })) || 0;
      const failedQC = await QCCheck.countDocuments(getTenantQuery(req, { isActive: true, overallResult: 'rejected' })) || 0;
      const pendingQC = await QCCheck.countDocuments(getTenantQuery(req, { isActive: true, overallResult: 'pending' })) || 0;

      // Dispatch
      const activeDispatches = await DispatchOrder.countDocuments(getTenantQuery(req, { isActive: true, status: { $in: ['In Transit', 'Loading', 'Scheduled', 'in_transit', 'loaded'] } })) || 0;
      const totalDispatches = await DispatchOrder.countDocuments(getTenantQuery(req, { isActive: true })) || 0;

      return {
        kpis: {
          // Production
          activeProductionOrders,
          completedToday,
          totalBatches,
          // Machines
          avgOEE,
          runningMachines,
          totalMachines,
          // Sales
          totalSalesOrders,
          totalRevenue: Math.round(totalRevenue),
          pendingInvoices,
          // Inventory
          lowStockCount,
          totalItems,
          // HR
          totalEmployees,
          // CRM
          totalLeads,
          totalCustomers,
          wonLeads,
          // Purchase
          totalSuppliers,
          pendingPOs,
          // Quality
          totalQCChecks,
          failedQC,
          pendingQC,
          // Dispatch
          activeDispatches,
          totalDispatches,
        },
        systemHealth: 'Optimal',
        lastRefreshedAt: new Date(),
      };
    } catch (err) {
      console.warn('[Dashboard KPI Warning]', err.message);
      return {
        kpis: {
          activeProductionOrders: 0,
          completedToday: 0,
          totalBatches: 0,
          avgOEE: 0,
          runningMachines: 0,
          totalMachines: 0,
          totalSalesOrders: 0,
          totalRevenue: 0,
          pendingInvoices: 0,
          lowStockCount: 0,
          totalItems: 0,
          totalEmployees: 0,
          totalLeads: 0,
          totalCustomers: 0,
          wonLeads: 0,
          totalSuppliers: 0,
          pendingPOs: 0,
          totalQCChecks: 0,
          failedQC: 0,
          pendingQC: 0,
          activeDispatches: 0,
          totalDispatches: 0,
        },
        systemHealth: 'Optimal',
        lastRefreshedAt: new Date(),
      };
    }
  },
};
