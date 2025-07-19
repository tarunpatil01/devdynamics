import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  it('renders message and close button', () => {
    render(<Toast message="Test message" onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render if message is empty', () => {
    render(<Toast message="" onClose={() => {}} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Toast message="Close me" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-dismisses after timeout', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<Toast message="Auto dismiss" onClose={onClose} timeout={1000} />);
    jest.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('is accessible with role and aria attributes', () => {
    render(<Toast message="Accessible" onClose={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('tabIndex', '0');
  });
});
