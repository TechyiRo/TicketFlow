const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { uploadToCloudinary } = require('../middleware/upload');

// Generate tokens helper
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Set refresh token cookie helper
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Register User
 */
exports.registerUser = async (req, res) => {
  try {
    const { fullName, username, password, avatar, companyName, companyAddress, contactNumber, companyEmail } = req.body;

    // Check if username exists in User or Employee database
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    const existingEmp = await Employee.findOne({ username: username });
    if (existingUser || existingEmp) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Handle logo upload if provided
    let logoUrl = '';
    if (req.file) {
      logoUrl = await uploadToCloudinary(req.file, 'ticketflow_logos');
    }

    const newUser = new User({
      fullName,
      username: username.toLowerCase(),
      passwordHash,
      plainTextPassword: password,
      avatar,
      company: {
        name: companyName,
        address: companyAddress,
        contactNumber,
        email: companyEmail || undefined,
      },
      logo: logoUrl,
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar,
        company: newUser.company,
        logo: newUser.logo,
      },
    });
  } catch (error) {
    console.error('User registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Register Employee
 */
exports.registerEmployee = async (req, res) => {
  try {
    const { fullName, username, email, password, avatar, department } = req.body;

    // Check if username/email exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    const existingEmp = await Employee.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
    if (existingUser || existingEmp) {
      return res.status(400).json({ message: 'Username or Email is already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const newEmployee = new Employee({
      fullName,
      username,
      email: email.toLowerCase(),
      passwordHash,
      plainTextPassword: password,
      avatar: avatar || '',
      department,
    });

    await newEmployee.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newEmployee);
    newEmployee.refreshToken = refreshToken;
    await newEmployee.save();

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: {
        id: newEmployee._id,
        fullName: newEmployee.fullName,
        username: newEmployee.username,
        email: newEmployee.email,
        role: newEmployee.role,
        avatar: newEmployee.avatar,
        department: newEmployee.department,
      },
    });
  } catch (error) {
    console.error('Employee registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * User Login
 */
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        company: user.company,
        logo: user.logo,
      },
    });
  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Employee Login
 */
exports.loginEmployee = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hardcoded Admin login check
    if (username.toLowerCase() === 'admin' && password === 'WinRo') {
      let adminAccount = await Employee.findOne({ username: 'admin' });
      if (!adminAccount) {
        const passwordHash = await bcrypt.hash('WinRo', 10);
        adminAccount = new Employee({
          fullName: 'System Administrator',
          username: 'admin',
          email: 'admin@ticketflow.local',
          passwordHash,
          role: 'admin',
          department: 'Administration',
        });
        await adminAccount.save();
      }

      // If somehow the role got changed, ensure it's admin
      if (adminAccount.role !== 'admin') {
        adminAccount.role = 'admin';
        await adminAccount.save();
      }

      const { accessToken, refreshToken } = generateTokens(adminAccount);
      adminAccount.refreshToken = refreshToken;
      await adminAccount.save();

      setRefreshCookie(res, refreshToken);

      return res.json({
        accessToken,
        user: {
          id: adminAccount._id,
          fullName: adminAccount.fullName,
          username: adminAccount.username,
          email: adminAccount.email,
          role: adminAccount.role,
          avatar: adminAccount.avatar,
          department: adminAccount.department,
        },
      });
    }

    // Normal employee login
    // Search by username or email
    const employee = await Employee.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });
    if (!employee || !employee.isActive) {
      return res.status(400).json({ message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(employee);
    employee.refreshToken = refreshToken;
    await employee.save();

    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: employee._id,
        fullName: employee.fullName,
        username: employee.username,
        email: employee.email,
        role: employee.role,
        avatar: employee.avatar,
        department: employee.department,
      },
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Unified Login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const usernameLower = username.toLowerCase();

    // 1. Hardcoded Admin login check
    if (usernameLower === 'admin' && password === 'WinRo') {
      let adminAccount = await Employee.findOne({ username: 'admin' });
      if (!adminAccount) {
        const passwordHash = await bcrypt.hash('WinRo', 10);
        adminAccount = new Employee({
          fullName: 'System Administrator',
          username: 'admin',
          email: 'admin@ticketflow.local',
          passwordHash,
          plainTextPassword: 'WinRo',
          role: 'admin',
          department: 'Administration',
        });
        await adminAccount.save();
      }

      if (adminAccount.role !== 'admin') {
        adminAccount.role = 'admin';
        await adminAccount.save();
      }

      const { accessToken, refreshToken } = generateTokens(adminAccount);
      adminAccount.refreshToken = refreshToken;
      await adminAccount.save();

      setRefreshCookie(res, refreshToken);

      return res.json({
        accessToken,
        user: {
          id: adminAccount._id,
          fullName: adminAccount.fullName,
          username: adminAccount.username,
          email: adminAccount.email,
          role: adminAccount.role,
          avatar: adminAccount.avatar,
          department: adminAccount.department,
        },
      });
    }

    // 2. Normal employee / admin check in Employee collection
    let employee = await Employee.findOne({
      $or: [{ username: username }, { email: usernameLower }],
    });

    if (employee && employee.isActive) {
      const isMatch = await bcrypt.compare(password, employee.passwordHash);
      if (isMatch) {
        const { accessToken, refreshToken } = generateTokens(employee);
        employee.refreshToken = refreshToken;
        await employee.save();

        setRefreshCookie(res, refreshToken);

        return res.json({
          accessToken,
          user: {
            id: employee._id,
            fullName: employee.fullName,
            username: employee.username,
            email: employee.email,
            role: employee.role,
            avatar: employee.avatar,
            department: employee.department,
          },
        });
      }
    }

    // 3. Normal user check in User collection
    const user = await User.findOne({ username: usernameLower });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        setRefreshCookie(res, refreshToken);

        return res.json({
          accessToken,
          user: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            company: user.company,
            logo: user.logo,
          },
        });
      }
    }

    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Unified login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};


/**
 * Refresh Tokens
 */
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Try finding in users first, then employees
    let user = await User.findById(decoded.id);
    let role = 'user';

    if (!user) {
      user = await Employee.findById(decoded.id);
      role = 'employee';
    }

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token mismatch or user not found' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    setRefreshCookie(res, tokens.refreshToken);

    return res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        ...(role === 'user'
          ? { company: user.company, logo: user.logo }
          : { email: user.email, department: user.department }),
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Clear refresh token in DB
      let user = await User.findOne({ refreshToken });
      if (!user) {
        user = await Employee.findOne({ refreshToken });
      }

      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};

/**
 * Get Me (profile query)
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'user') {
      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } else {
      const employee = await Employee.findById(req.user.id).select('-passwordHash');
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      return res.json(employee);
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
