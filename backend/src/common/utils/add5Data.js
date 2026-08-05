import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import { Item } from '../../modules/inventory/inventory.model.js';
import { SalesOrder, SalesInvoice } from '../../modules/sales/sales.model.js';
import { ProductionOrder } from '../../modules/production/production.model.js';
import { Machine, MachineLog } from '../../modules/machine/machine.model.js';
import { QCCheck } from '../../modules/quality/quality.model.js';
import { Ledger } from '../../modules/finance/finance.model.js';
import { Lead, Customer } from '../../modules/crm/crm.model.js';
import { Recipe } from '../../modules/recipe/recipe.model.js';

const seed5Records = async () => {
  try {
    console.log(`[Seed 5 Records] Connecting to ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

    // Clear previous partial test data
    await Lead.deleteMany({});
    await Customer.deleteMany({});
    await Item.deleteMany({});
    await Recipe.deleteMany({});
    await SalesOrder.deleteMany({});
    await SalesInvoice.deleteMany({});
    await ProductionOrder.deleteMany({});
    await Machine.deleteMany({});
    await MachineLog.deleteMany({});
    await QCCheck.deleteMany({});
    await Ledger.deleteMany({});

    // 1. Add CRM Lead & Customer
    const lead = await Lead.create({
      name: 'Mr. Rajesh Verma',
      company: 'Taj Hotels & Resorts',
      email: 'procurement@tajhotels.com',
      phone: '+91 98200 12345',
      status: 'won',
    });
    const customer = await Customer.create({
      name: 'Taj Hotels & Resorts',
      email: 'procurement@tajhotels.com',
      phone: '+91 98200 12345',
      type: 'hotel',
      creditLimit: 500000,
    });
    console.log('✅ 1. Created CRM Customer:', customer.name);

    // 2. Add 2 Master Stock Items & Recipe
    const item1 = await Item.create({
      name: 'Alphonso Mango Puree',
      code: 'RM-MGO-101',
      type: 'raw_material',
      unit: 'Kg',
      totalQty: 2500,
      reorderLevel: 500,
    });
    const item2 = await Item.create({
      name: 'PET Bottle 500ml',
      code: 'PKG-BOT-500',
      type: 'packaging',
      unit: 'Pcs',
      totalQty: 12000,
      reorderLevel: 2000,
    });

    const recipe = await Recipe.create({
      name: 'Alphonso Mango Juice 500ml Recipe',
      productId: item1._id,
      outputQty: 1000,
      outputUnit: 'Bottles',
      ingredients: [
        { itemId: item1._id, itemName: item1.name, qtyPerBatch: 150, unit: 'Kg' },
        { itemId: item2._id, itemName: item2.name, qtyPerBatch: 1000, unit: 'Pcs' }
      ]
    });
    console.log('✅ 2. Created Inventory Items:', item1.name, ',', item2.name, '& Recipe BOM:', recipe.name);

    // 3. Add Sales Order & Invoice
    const salesOrder = await SalesOrder.create({
      orderNo: 'SO-2026-001',
      customerId: customer._id,
      customerName: customer.name,
      items: [
        { productId: item1._id, productName: 'Alphonso Mango Juice 500ml', qty: 5000, rate: 30, amount: 150000 }
      ],
      totalAmount: 150000,
      status: 'in_production',
    });
    const invoice = await SalesInvoice.create({
      invoiceNo: 'INV-2026-001',
      salesOrderId: salesOrder._id,
      customerId: customer._id,
      customerName: customer.name,
      totalAmount: 150000,
      dueAmount: 150000,
      status: 'unpaid',
    });
    console.log('✅ 3. Created Sales Order:', salesOrder.orderNo, 'with Invoice:', invoice.invoiceNo);

    // 4. Add Production Order & Machine
    const productionOrder = await ProductionOrder.create({
      orderNo: 'PO-2026-001',
      batchId: 'BATCH-MGO-2026',
      productId: item1._id,
      recipeId: recipe._id,
      qtyPlanned: 5000,
      qtyProduced: 4850,
      shiftId: 'Morning',
      status: 'running',
      startedAt: new Date(),
    });

    const machine = await Machine.create({
      code: 'MAC-FIL-01',
      name: 'Rotary Bottling & Capping Line #1',
      category: 'filler',
      currentStatus: 'running',
    });

    await MachineLog.create({
      machineId: machine._id,
      currentStatus: 'running',
      computed: { oee: 88.5, availability: 92, performance: 95, quality: 99 },
      isActive: true,
    });
    console.log('✅ 4. Created Production Batch:', productionOrder.batchId, '& Machine:', machine.name);

    // 5. Add QC Check Inspection & Finance Ledger Entry
    const qcCheck = await QCCheck.create({
      checkNo: 'QC-MGO-901',
      refType: 'finished_goods',
      batchId: productionOrder.batchId,
      overallResult: 'approved',
      parameters: [
        { name: 'Brix Level', value: '13.5 °Brix', passRange: '12.5 - 14.5 °Brix', isPass: true },
        { name: 'pH Titration', value: '3.8 pH', passRange: '3.5 - 4.2 pH', isPass: true },
      ],
    });

    const ledger = await Ledger.create({
      accountName: 'Taj Hotel Order Advance Collection',
      type: 'credit',
      amount: 150000,
      refType: 'SalesInvoicing',
      date: new Date(),
    });
    console.log('✅ 5. Created QC Inspection:', qcCheck.checkNo, '& Financial Ledger:', ledger.accountName);

    console.log('\n==================================================');
    console.log('🎉 Successfully added 5 data records to MongoDB!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding 5 data records:', err);
    process.exit(1);
  }
};

seed5Records();
