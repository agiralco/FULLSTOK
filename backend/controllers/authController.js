// Task Owner: Gilang Ramadan - Authentication & Security
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Validators = require('../utils/validators');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role = 'user' } = req.body;

      // Enhanced validation using Validators
      const validation = Validators.validateRegisterInput(name, email, password, role);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          field: validation.field || 'validation'
        });
      }

      // Check if user exists
      try {
        const existingUser = await User.findByEmail(validation.email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already registered',
            field: 'email'
          });
        }
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during registration',
          error: 'User lookup failed'
        });
      }

      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(validation.password, 10);
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        return res.status(500).json({
          success: false,
          message: 'Password processing error',
          error: 'Failed to hash password'
        });
      }

      // Create user
      let user;
      try {
        user = await User.create({
          name: validation.name,
          email: validation.email,
          password: hashedPassword,
          role: validation.role
        });
      } catch (createError) {
        console.error('User creation error:', createError);
        return res.status(500).json({
          success: false,
          message: 'User creation failed',
          error: 'Failed to create user account'
        });
      }

      // Generate JWT
      let token;
      try {
        token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );
      } catch (jwtError) {
        console.error('JWT generation error:', jwtError);
        return res.status(500).json({
          success: false,
          message: 'Token generation failed',
          error: 'Failed to generate authentication token'
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: 'An unexpected error occurred during registration'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Enhanced validation using Validators
      const validation = Validators.validateLoginInput(email, password);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          field: validation.field || 'validation'
        });
      }

      // Find user
      let user;
      try {
        user = await User.findByEmail(validation.email);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
            field: 'credentials'
          });
        }
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during login',
          error: 'User lookup failed'
        });
      }

      // Check user status
<<<<<<< HEAD
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
          field: 'account'
        });
      }
=======
      // if (!user.is_active) {
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Account is deactivated',
      //     field: 'account'
      //   });
      // }
>>>>>>> origin/gojiberry

      // Check password
      let isValidPassword;
      try {
        isValidPassword = await bcrypt.compare(validation.password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
            field: 'credentials'
          });
        }
      } catch (compareError) {
        console.error('Password comparison error:', compareError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error',
          error: 'Failed to verify credentials'
        });
      }

      // Generate JWT
      let token;
      try {
        token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );
      } catch (jwtError) {
        console.error('JWT generation error:', jwtError);
        return res.status(500).json({
          success: false,
          message: 'Token generation failed',
          error: 'Failed to generate authentication token'
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
            department: user.department
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'An unexpected error occurred during login'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
<<<<<<< HEAD
            department: user.department,
            phone: user.phone,
            address: user.address,
            hire_date: user.hire_date,
            salary: user.salary,
            is_active: user.is_active
=======
            department: user.department
>>>>>>> origin/gojiberry
          }
        }
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: 'Database error occurred'
      });
    }
  }
}

module.exports = AuthController;
