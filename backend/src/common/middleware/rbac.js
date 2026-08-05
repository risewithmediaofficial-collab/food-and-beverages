export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Forbidden: Authentication required' });
    }

    const roleName = req.user.roleName || req.user.role?.name || '';
    const permissions = req.user.role?.permissions || req.user.permissions || [];

    const isSuperAdmin =
      roleName.toLowerCase().includes('admin') ||
      roleName.toLowerCase().includes('general manager') ||
      permissions.includes('*') ||
      permissions.includes('all');

    if (isSuperAdmin || permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Missing required permission [${requiredPermission}]`,
    });
  };
};

