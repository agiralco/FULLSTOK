// Task Owner: Gilang Ramadan - Authentication & Security
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    // Convert single role to array for consistency
    let allowedRoles = Array.isArray(roles) ? [...roles] : [roles];
    
    // Map 'user' allowed role to also accept 'employee' and 'manager'
    if (allowedRoles.includes('user')) {
      allowedRoles.push('employee', 'manager');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = authorize;
