import express from 'express';
import { dashboardService } from './dashboard.service.js';

const router = express.Router();

router.get('/factory-overview', async (req, res) => {
  try {
    const data = await dashboardService.getOverviewKPIs();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
