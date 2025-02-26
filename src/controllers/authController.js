const User = require('../models/user');

// User registration
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirm_password, company_name, address, phone } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.render('auth/register', { 
        error: 'Username, email and password are required',
        formData: req.body
      });
    }
    
    if (password !== confirm_password) {
      return res.render('auth/register', { 
        error: 'Passwords do not match',
        formData: req.body
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.render('auth/register', { 
        error: 'Username already taken',
        formData: req.body
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.render('auth/register', { 
        error: 'Email already registered',
        formData: req.body
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      company_name: company_name || '',
      address: address || '',
      phone: phone || ''
    });
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('auth/register', { 
      error: 'An error occurred during registration',
      formData: req.body
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.render('auth/login', { 
        error: 'Username and password are required',
        formData: { username }
      });
    }
    
    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.render('auth/login', { 
        error: 'Invalid username or password',
        formData: { username }
      });
    }
    
    // Validate password
    const isValidPassword = await User.validatePassword(user, password);
    if (!isValidPassword) {
      return res.render('auth/login', { 
        error: 'Invalid username or password',
        formData: { username }
      });
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', { 
      error: 'An error occurred during login',
      formData: { username: req.body.username }
    });
  }
};

// User logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
};

// Register page
exports.registerPage = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', { title: 'Register', formData: {}, error: null });
};

// Login page
exports.loginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { title: 'Login', formData: {}, error: null });
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { username, email, company_name, address, phone, current_password, new_password, confirm_password } = req.body;
    
    // Get current user data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.render('auth/profile', { 
        error: 'User not found',
        user: req.body,
        success: null
      });
    }
    
    // Check if password change is requested
    let updateData = {
      username,
      email,
      company_name: company_name || '',
      address: address || '',
      phone: phone || ''
    };
    
    if (new_password) {
      // Validate current password
      if (!current_password) {
        return res.render('auth/profile', { 
          error: 'Current password is required to set a new password',
          user: { ...currentUser, ...updateData },
          success: null
        });
      }
      
      const isValidPassword = await User.validatePassword(currentUser, current_password);
      if (!isValidPassword) {
        return res.render('auth/profile', { 
          error: 'Current password is incorrect',
          user: { ...currentUser, ...updateData },
          success: null
        });
      }
      
      // Validate new password
      if (new_password !== confirm_password) {
        return res.render('auth/profile', { 
          error: 'New passwords do not match',
          user: { ...currentUser, ...updateData },
          success: null
        });
      }
      
      updateData.password = new_password;
    }
    
    // Update user
    await User.update(userId, updateData);
    
    // Update session if username or email changed
    if (username !== req.session.user.username || email !== req.session.user.email) {
      req.session.user.username = username;
      req.session.user.email = email;
    }
    
    // Get updated user data
    const updatedUser = await User.findById(userId);
    
    res.render('auth/profile', { 
      success: 'Profile updated successfully',
      user: updatedUser,
      error: null
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.render('auth/profile', { 
      error: 'An error occurred while updating profile',
      user: req.body,
      success: null
    });
  }
};

// Profile page
exports.profilePage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    
    res.render('auth/profile', { 
      title: 'My Profile',
      user,
      error: null,
      success: null
    });
  } catch (err) {
    console.error('Profile page error:', err);
    res.render('auth/profile', { 
      title: 'My Profile',
      user: null,
      error: 'An error occurred while loading profile',
      success: null
    });
  }
};