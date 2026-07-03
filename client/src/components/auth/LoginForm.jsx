import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { loginSchema } from '../../utils/validators';
import Input from '../shared/Input';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

/**
 * LoginForm component
 */
export function LoginForm({ onToggleForm, onSubmitSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await onSubmitSuccess('login', data.username, data.password);
      toast.success('Successfully logged in!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-5">
      {/* Username / Email */}
      <Input
        label="Username or Email"
        name="username"
        placeholder="Enter username or email"
        icon={User}
        error={errors.username}
        disabled={loading}
        {...register('username')}
      />

      {/* Password */}
      <Input
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        icon={Lock}
        error={errors.password}
        disabled={loading}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-secondary hover:text-text-primary focus:outline-none p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...register('password')}
      />

      {/* Remember me & Forgot Password */}
      <div className="flex items-center justify-between text-xs font-semibold select-none">
        <label className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-borderColor bg-background-elevated/50 text-accent-primary focus:ring-accent-primary focus:ring-opacity-25"
          />
          Remember me
        </label>
        
        <a 
          href="#forgot" 
          onClick={(e) => {
            e.preventDefault();
            toast.success('If you are an Employee, please contact the Admin to reset your password. Users can simulate a reset.');
          }}
          className="text-accent-primary hover:text-accent-glow transition-colors"
        >
          Forgot Password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="w-full mt-2 h-[52px] md:h-11 min-h-[52px] md:min-h-[44px]"
      >
        Sign In to Portal
      </Button>

      {/* Registration Toggle Link */}
      <div className="text-center text-xs font-semibold text-text-secondary mt-2">
        Don't have an account?{' '}
        <a
          href="#register"
          onClick={(e) => {
            e.preventDefault();
            onToggleForm();
          }}
          className="text-accent-primary hover:text-accent-glow transition-colors"
        >
          Create one now
        </a>
      </div>
    </form>
  );
}

export default LoginForm;
