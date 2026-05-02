// Task Owner: Muhtari Anwar - Employee Directory (Users CRUD)
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Validators = require('../utils/validators');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const { search, department, role, page = 1, limit = 10 } = req.query;
      
      let users;
      
      if (search) {
        users = await User.search(search);
      } else if (department) {
        users = await User.getByDepartment(department);
      } else {
        users = await User.getAll();
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedUsers = users.slice(startIndex, endIndex);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: paginatedUsers,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: users.length,
            total_pages: Math.ceil(users.length / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: 'Database error occurred'
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          field: 'id'
        });
      }

      const user = await User.findById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          field: 'id'
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: 'Database error occurred'
      });
    }
  }

  static async createUser(req, res) {
    try {
      const { 
        name, 
        email, 
        password, 
        role = 'user', 
        position, 
        department, 
        phone, 
        address, 
        hire_date, 
        salary 
      } = req.body;

      // Enhanced validation
      const nameValidation = Validators.validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: nameValidation.message,
          field: 'name'
        });
      }

      const emailValidation = Validators.validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.message,
          field: 'email'
        });
      }

      const passwordValidation = Validators.validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
          field: 'password'
        });
      }

      // Position validation (required)
      if (!position || typeof position !== 'string' || position.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Position is required and cannot be empty',
          field: 'position'
        });
      }

      const trimmedPosition = position.trim();
      if (trimmedPosition.length < 2 || trimmedPosition.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Position must be between 2 and 100 characters',
          field: 'position'
        });
      }

      // Optional field validations
      let validatedData = {
        name: nameValidation.name,
        email: emailValidation.email,
        password: passwordValidation.password,
        role: role || 'user',
        position: trimmedPosition
      };

      // Department validation (optional)
      if (department) {
        const trimmedDepartment = department.trim();
        if (trimmedDepartment.length > 0 && trimmedDepartment.length <= 100) {
          validatedData.department = trimmedDepartment;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Department must be between 1 and 100 characters',
            field: 'department'
          });
        }
      }

      // Phone validation (optional)
      if (phone) {
        const trimmedPhone = phone.trim();
        const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
        if (!phoneRegex.test(trimmedPhone)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format',
            field: 'phone'
          });
        }
        if (trimmedPhone.length <= 20) {
          validatedData.phone = trimmedPhone;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Phone number must be 20 characters or less',
            field: 'phone'
          });
        }
      }

      // Address validation (optional)
      if (address) {
        const trimmedAddress = address.trim();
        if (trimmedAddress.length <= 500) {
          validatedData.address = trimmedAddress;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Address must be 500 characters or less',
            field: 'address'
          });
        }
      }

      // Hire date validation (optional)
      if (hire_date) {
        const hireDateObj = new Date(hire_date);
        if (isNaN(hireDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid hire date format',
            field: 'hire_date'
          });
        }
        validatedData.hire_date = hire_date;
      }

      // Salary validation (optional)
      if (salary) {
        const salaryNum = parseFloat(salary);
        if (isNaN(salaryNum) || salaryNum < 0 || salaryNum > 999999999.99) {
          return res.status(400).json({
            success: false,
            message: 'Invalid salary amount',
            field: 'salary'
          });
        }
        validatedData.salary = salaryNum;
      }

      // Check if user exists
      let existingUser;
      try {
        existingUser = await User.findByEmail(validatedData.email);
        if (existingUser && existingUser.id !== parseInt(req.params.id)) {
          return res.status(409).json({
            success: false,
            message: 'Email already registered by another user',
            field: 'email'
          });
        }
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during user creation',
          error: 'Failed to check existing user'
        });
      }

      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(validatedData.password, 10);
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        return res.status(500).json({
          success: false,
          message: 'Password processing error',
          error: 'Failed to hash password'
        });
      }

      validatedData.password = hashedPassword;

      // Create user
      let user;
      try {
        user = await User.create(validatedData);
        this.createdUserId = user.id; // Store created user ID
      } catch (createError) {
        console.error('User creation error:', createError);
        return res.status(500).json({
          success: false,
          message: 'User creation failed',
          error: 'Failed to create user account'
        });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'User creation failed',
        error: 'An unexpected error occurred'
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          field: 'id'
        });
      }

      // Check if user exists
      let existingUser;
      try {
        existingUser = await User.findById(parseInt(id));
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
            field: 'id'
          });
        }
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during user update',
          error: 'Failed to find user'
        });
      }

      // Validate update data
      const validatedUpdateData = {};

      // Name validation (if provided)
      if (updateData.name !== undefined) {
        const nameValidation = Validators.validateName(updateData.name);
        if (!nameValidation.valid) {
          return res.status(400).json({
            success: false,
            message: nameValidation.message,
            field: 'name'
          });
        }
        validatedUpdateData.name = nameValidation.name;
      }

      // Email validation (if provided)
      if (updateData.email !== undefined) {
        const emailValidation = Validators.validateEmail(updateData.email);
        if (!emailValidation.valid) {
          return res.status(400).json({
            success: false,
            message: emailValidation.message,
            field: 'email'
          });
        }
        
        // Check if email is already used by another user
        if (emailValidation.email !== existingUser.email) {
          const emailUser = await User.findByEmail(emailValidation.email);
          if (emailUser && emailUser.id !== parseInt(id)) {
            return res.status(409).json({
              success: false,
              message: 'Email already registered by another user',
              field: 'email'
            });
          }
        }
        validatedUpdateData.email = emailValidation.email;
      }

      // Position validation (if provided)
      if (updateData.position !== undefined) {
        if (!updateData.position || typeof updateData.position !== 'string' || updateData.position.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Position is required and cannot be empty',
            field: 'position'
          });
        }
        const trimmedPosition = updateData.position.trim();
        if (trimmedPosition.length < 2 || trimmedPosition.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Position must be between 2 and 100 characters',
            field: 'position'
          });
        }
        validatedUpdateData.position = trimmedPosition;
      }

      // Role validation (if provided)
      if (updateData.role !== undefined) {
        const roleValidation = Validators.validateRole(updateData.role);
        if (!roleValidation.valid) {
          return res.status(400).json({
            success: false,
            message: roleValidation.message,
            field: 'role'
          });
        }
        validatedUpdateData.role = roleValidation.role;
      }

      // Handle other optional fields...
      if (updateData.department !== undefined) {
        const trimmedDepartment = updateData.department ? updateData.department.trim() : null;
        if (trimmedDepartment && (trimmedDepartment.length === 0 || trimmedDepartment.length > 100)) {
          return res.status(400).json({
            success: false,
            message: 'Department must be between 1 and 100 characters',
            field: 'department'
          });
        }
        validatedUpdateData.department = trimmedDepartment;
      }

      if (updateData.phone !== undefined) {
        if (updateData.phone) {
          const trimmedPhone = updateData.phone.trim();
          const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
          if (!phoneRegex.test(trimmedPhone) || trimmedPhone.length > 20) {
            return res.status(400).json({
              success: false,
              message: 'Invalid phone number format',
              field: 'phone'
            });
          }
          validatedUpdateData.phone = trimmedPhone;
        } else {
          validatedUpdateData.phone = null;
        }
      }

      if (updateData.address !== undefined) {
        const trimmedAddress = updateData.address ? updateData.address.trim() : null;
        if (trimmedAddress && trimmedAddress.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Address must be 500 characters or less',
            field: 'address'
          });
        }
        validatedUpdateData.address = trimmedAddress;
      }

      if (updateData.hire_date !== undefined) {
        if (updateData.hire_date) {
          const hireDateObj = new Date(updateData.hire_date);
          if (isNaN(hireDateObj.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Invalid hire date format',
              field: 'hire_date'
            });
          }
          validatedUpdateData.hire_date = updateData.hire_date;
        } else {
          validatedUpdateData.hire_date = null;
        }
      }

      if (updateData.salary !== undefined) {
        if (updateData.salary !== null && updateData.salary !== undefined) {
          const salaryNum = parseFloat(updateData.salary);
          if (isNaN(salaryNum) || salaryNum < 0 || salaryNum > 999999999.99) {
            return res.status(400).json({
              success: false,
              message: 'Invalid salary amount',
              field: 'salary'
            });
          }
          validatedUpdateData.salary = salaryNum;
        } else {
          validatedUpdateData.salary = null;
        }
      }

      if (updateData.is_active !== undefined) {
        if (typeof updateData.is_active !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'is_active must be a boolean value',
            field: 'is_active'
          });
        }
        validatedUpdateData.is_active = updateData.is_active;
      }

      // Update user
      let updateResult;
      try {
        updateResult = await User.update(parseInt(id), validatedUpdateData);
        if (!updateResult) {
          return res.status(500).json({
            success: false,
            message: 'No changes made to user',
            error: 'Update operation failed'
          });
        }
      } catch (updateError) {
        console.error('User update error:', updateError);
        return res.status(500).json({
          success: false,
          message: 'User update failed',
          error: 'Failed to update user account'
        });
      }

      // Get updated user data
      const updatedUser = await User.findById(parseInt(id));
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'User update failed',
        error: 'An unexpected error occurred'
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          field: 'id'
        });
      }

      // Check if user exists
      const user = await User.findById(parseInt(id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          field: 'id'
        });
      }

      // Prevent deletion of the last admin
      if (user.role === 'admin') {
        const adminCount = await User.getAdminCount();
        if (adminCount <= 1) {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete the last admin user',
            field: 'id'
          });
        }
      }

      // Delete user
      let deleteResult;
      try {
        deleteResult = await User.delete(parseInt(id));
        if (!deleteResult) {
          return res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: 'Delete operation failed'
          });
        }
      } catch (deleteError) {
        console.error('User deletion error:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'User deletion failed',
          error: 'Failed to delete user account'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: { deleted_user: { id: user.id, name: user.name, email: user.email } }
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'User deletion failed',
        error: 'An unexpected error occurred'
      });
    }
  }
}

module.exports = UserController;
