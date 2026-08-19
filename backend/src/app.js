import express from 'express';
import cors from 'cors';
import { authenticate } from './common/middleware/auth.js';
import { errorHandler } from './common/middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import purchaseRoutes from './modules/purchase/purchase.routes.js';
import recipeRoutes from './modules/recipe/recipe.routes.js';
import productionRoutes from './modules/production/production.routes.js';
import machineRoutes from './modules/machine/machine.routes.js';
import qualityRoutes from './modules/quality/quality.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import dispatchRoutes from './modules/dispatch/dispatch.routes.js';
import hrRoutes from './modules/hr/hr.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';
import orgRoutes from './modules/org/org.routes.js';
import packagingRoutes from './modules/packaging/packaging.routes.js';
import superadminRoutes, { ensureSuperAdmin } from './modules/superadmin/superadmin.routes.js';

const app = express();

ensureSuperAdmin();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Juice ERP Enterprise API',
    health: '/api/health',
    apiBase: '/api/v1',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Juice ERP Enterprise API', timestamp: new Date() });
});

app.use('/api/v1/public', superadminRoutes);
app.use('/api/v1/superadmin', superadminRoutes);

app.use(authenticate);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/production', productionRoutes);
app.use('/api/v1/machines', machineRoutes);
app.use('/api/v1/quality', qualityRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/packaging', packagingRoutes);

app.use(errorHandler);

export default app;
