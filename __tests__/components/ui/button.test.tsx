import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/ui/button';

describe('Button Component', () => {
  it('renders correctly with child text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies destructive styling when variant is destructive', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-destructive');
  });

  it('applies outline styling when variant is outline', () => {
    render(<Button variant="outline">Cancel</Button>);
    const button = screen.getByRole('button', { name: /cancel/i });
    expect(button.className).toContain('border-input');
  });

  it('fires onClick handler when pressed', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('blocks clicks and appears disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Submit</Button>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
