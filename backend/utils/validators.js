// Task Owner: Gilang Ramadan - Authentication & Security
class Validators {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, message: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, message: 'Invalid email format' };
    }

    // Check if email starts with "admin" (security requirement)
    if (!trimmedEmail.startsWith('admin')) {
      return { valid: false, message: 'Email must start with "admin" for security purposes' };
    }

    return { valid: true, email: trimmedEmail };
  }

  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required' };
    }

    const trimmedPassword = password.trim();
    
    if (trimmedPassword.length === 0) {
      return { valid: false, message: 'Password cannot be empty' };
    }

    if (trimmedPassword.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }

    if (trimmedPassword.length > 100) {
      return { valid: false, message: 'Password must be less than 100 characters long' };
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'admin123', 'letmein', 'welcome'
    ];
    
    if (weakPasswords.includes(trimmedPassword.toLowerCase())) {
      return { valid: false, message: 'Password is too common. Please choose a stronger password' };
    }

    return { valid: true, password: trimmedPassword };
  }

  static validateName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, message: 'Name is required' };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      return { valid: false, message: 'Name cannot be empty' };
    }

    if (trimmedName.length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters long' };
    }

    if (trimmedName.length > 100) {
      return { valid: false, message: 'Name must be less than 100 characters long' };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { valid: true, name: trimmedName };
  }

  static validateRole(role) {
    if (!role || typeof role !== 'string') {
      return { valid: false, message: 'Role is required' };
    }

    const trimmedRole = role.trim().toLowerCase();
    const validRoles = ['admin', 'user'];

    if (!validRoles.includes(trimmedRole)) {
      return { valid: false, message: `Role must be one of: ${validRoles.join(', ')}` };
    }

    return { valid: true, role: trimmedRole };
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  }

  static validateLoginInput(email, password) {
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.valid) {
      return emailValidation;
    }

    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return passwordValidation;
    }

    return { valid: true, email: emailValidation.email, password: passwordValidation.password };
  }

  static validateRegisterInput(name, email, password, role) {
    const nameValidation = this.validateName(name);
    if (!nameValidation.valid) {
      return nameValidation;
    }

    const inputValidation = this.validateLoginInput(email, password);
    if (!inputValidation.valid) {
      return inputValidation;
    }

    const roleValidation = this.validateRole(role);
    if (!roleValidation.valid) {
      return roleValidation;
    }

    return { 
      valid: true, 
      name: nameValidation.name, 
      email: inputValidation.email, 
      password: inputValidation.password,
      role: roleValidation.role
    };
  }
}

module.exports = Validators;
