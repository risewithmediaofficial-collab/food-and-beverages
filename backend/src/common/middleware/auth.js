import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';

const KNOWN_SECRETS = [
  config.jwtSecret,
  'super_secret_juice_erp_jwt_key_2026',
  'juice_erp_enterprise_jwt_secret_key_2026_super_secure_token',
  config.jwtRefreshSecret,
  'super_secret_refresh_key_2026',
].filter(Boolean);

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

  let decoded = null;
  for (const secret of KNOWN_SECRETS) {
    try {
      decoded = jwt.verify(token, secret);
      if (decoded) break;
    } catch (e) {
      // try next secret
    }
  }

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }

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
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied: Super Admin privilege required.' });
  }
  next();
};
