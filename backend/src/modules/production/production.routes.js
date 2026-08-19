import express from 'express';
import { ProductionOrder, ProductionPlan, Batch } from './production.model.js';
import { productionService } from './production.service.js';

const router = express.Router();

// 1. Production Orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await ProductionOrder.find({ isActive: true })
      .populate('productId')
      .populate('recipeId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const result = await productionService.createProductionOrder(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/orders/:id/start', async (req, res) => {
  try {
    const order = await productionService.startProductionOrder(req.params.id, req.user?.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/orders/:id/complete', async (req, res) => {
  try {
    const result = await productionService.completeProductionOrder(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const order = await ProductionOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Production order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await ProductionOrder.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Production order not found' });
    res.json({ success: true, message: 'Production order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Production Planning APIs
router.get('/plans', async (req, res) => {
  try {
    const plans = await ProductionPlan.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const result = await productionService.createProductionPlan(req.body);
    res.status(201).json({ success: true, data: result.plan, routedProductionOrder: result.productionOrder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await ProductionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Production plan not found' });
    const result = await productionService.routeProductionPlanToOrder(plan);
    res.json({ success: true, data: result.plan, routedProductionOrder: result.productionOrder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/plans/:id/complete', async (req, res) => {
  try {
    const result = await productionService.completeProductionPlan(req.params.id);
    res.json({ success: true, data: result.plan, routedProductionOrder: result.productionOrder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    await ProductionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Batch Management APIs
router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const batch = new Batch(req.body);
    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/batches/:id', async (req, res) => {
  try {
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
