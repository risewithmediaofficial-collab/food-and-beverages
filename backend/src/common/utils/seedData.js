import { Factory, Warehouse } from '../../modules/org/org.model.js';
import { Item, StockBatch } from '../../modules/inventory/inventory.model.js';
import { Supplier } from '../../modules/purchase/purchase.model.js';
import { Recipe } from '../../modules/recipe/recipe.model.js';
import { Machine, MachineLog } from '../../modules/machine/machine.model.js';
import { Customer, Lead } from '../../modules/crm/crm.model.js';
import { SalesOrder } from '../../modules/sales/sales.model.js';
import { ProductionOrder } from '../../modules/production/production.model.js';
import { QCCheck } from '../../modules/quality/quality.model.js';
import { generateBatchId } from './generateBatchId.js';

export const seedDatabase = async () => {
  console.warn('[Seed] Database seeding is disabled. Add your own data manually or via custom scripts.');
};
