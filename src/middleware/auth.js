// Middleware to check if user is authenticated
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // Make user data available to all views
  res.locals.user = req.session.user;
  next();
};