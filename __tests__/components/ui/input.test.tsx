import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../../components/ui/input';

describe('Input Component', () => {
  it('renders correctly with a placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
  });

  it('forwards the type attribute correctly', () => {
    render(<Input type="password" placeholder="Password" data-testid="password-input" />);
    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('captures user typing accurately', () => {
    const handleChange = jest.fn();
    render(<Input placeholder="Name" onChange={handleChange} data-testid="name-input" />);
    
    const input = screen.getByTestId('name-input');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('John Doe');
  });

  it('applies the disabled state correctly', () => {
    render(<Input disabled placeholder="Disabled input" data-testid="disabled-input" />);
    const input = screen.getByTestId('disabled-input');
    expect(input).toBeDisabled();
  });
});
