import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';

export const authenticate = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const isPublicRoute = req.originalUrl && (
    req.originalUrl.includes('/auth/login') ||
    req.originalUrl.includes('/auth/register') ||
    req.originalUrl.includes('/superadmin/login') ||
    req.originalUrl.includes('/public/')
  );

  if (isPublicRoute) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    // Allow Super Admin to pass x-org-id header to switch tenant context dynamically
    if (decoded.isSuperAdmin && req.headers['x-org-id']) {
      req.orgId = req.headers['x-org-id'];
    } else {
      req.orgId = decoded.orgId || null;
    }
    req.isSuperAdmin = Boolean(decoded.isSuperAdmin);
    req.isOrgAdmin = Boolean(decoded.isOrgAdmin);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied: Super Admin privilege required.' });
  }
  next();
};
