import { z } from 'zod';

// Username alphanumeric + underscores regex
const usernameRegex = /^[a-zA-Z0-9_]+$/;

// Password regex (1 uppercase, 1 number, 1 special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Phone number regex
const phoneRegex = /^\+?[0-9]{10,15}$/;

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const userRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(usernameRegex, 'Alphanumeric characters and underscores only'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Must contain 1 uppercase letter, 1 number, and 1 special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  avatar: z.string().min(1, 'Please select an avatar.'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyAddress: z.string().min(5, 'Company address must be at least 5 characters'),
  contactNumber: z.string()
    .min(10, 'Contact number must be at least 10 digits')
    .regex(phoneRegex, 'Please enter a valid contact number'),
  companyEmail: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const employeeRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(usernameRegex, 'Alphanumeric characters and underscores only'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Must contain 1 uppercase letter, 1 number, and 1 special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  department: z.string().min(1, 'Department is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ticketSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['technical', 'billing', 'general', 'feature', 'bug']),
});
