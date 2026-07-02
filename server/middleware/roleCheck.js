/**
 * Middleware to restrict route access to specific roles
 * @param {string|string[]} allowedRoles - Role or array of roles allowed to access
 */
module.exports = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
