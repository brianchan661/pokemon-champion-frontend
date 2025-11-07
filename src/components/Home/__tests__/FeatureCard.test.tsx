import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureCard } from '../FeatureCard';

const mockProps = {
  href: '/test',
  icon: <div data-testid="test-icon">Icon</div>,
  title: 'Test Feature',
  description: 'Test description',
  actionText: 'Learn More',
  colorScheme: 'blue' as const
};

describe('FeatureCard', () => {
  it('renders all required content', () => {
    render(<FeatureCard {...mockProps} />);
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<FeatureCard {...mockProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Test Feature - Test description');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies correct color scheme classes', () => {
    const { container } = render(<FeatureCard {...mockProps} colorScheme="green" />);
    
    const iconContainer = container.querySelector('.from-green-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<FeatureCard {...mockProps} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('link'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('validates props in development mode', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    process.env.NODE_ENV = 'development';
    
    render(<FeatureCard {...mockProps} title="" />);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing required props'),
      expect.any(Object)
    );
    
    consoleSpy.mockRestore();
  });
});