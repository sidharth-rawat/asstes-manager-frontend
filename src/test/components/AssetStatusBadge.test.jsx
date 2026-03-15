import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssetStatusBadge from '../../components/AssetStatusBadge';

describe('AssetStatusBadge', () => {
  it('renders "Active" for status=active', () => {
    render(<AssetStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Inactive" for status=inactive', () => {
    render(<AssetStatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders "Maintenance" for status=maintenance', () => {
    render(<AssetStatusBadge status="maintenance" />);
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('renders "Retired" for status=retired', () => {
    render(<AssetStatusBadge status="retired" />);
    expect(screen.getByText('Retired')).toBeInTheDocument();
  });

  it('renders "Lost" for status=lost', () => {
    render(<AssetStatusBadge status="lost" />);
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<AssetStatusBadge status="custom-status" />);
    expect(screen.getByText('custom-status')).toBeInTheDocument();
  });

  it('applies default small size classes', () => {
    const { container } = render(<AssetStatusBadge status="active" />);
    const badge = container.firstChild;
    expect(badge.className).toContain('text-xs');
  });

  it('applies large size classes when size=lg', () => {
    const { container } = render(<AssetStatusBadge status="active" size="lg" />);
    const badge = container.firstChild;
    expect(badge.className).toContain('text-sm');
    expect(badge.className).toContain('px-3');
  });

  it('applies emerald color for active status', () => {
    const { container } = render(<AssetStatusBadge status="active" />);
    expect(container.firstChild.className).toContain('emerald');
  });

  it('applies red color for retired status', () => {
    const { container } = render(<AssetStatusBadge status="retired" />);
    expect(container.firstChild.className).toContain('red');
  });

  it('applies amber color for maintenance status', () => {
    const { container } = render(<AssetStatusBadge status="maintenance" />);
    expect(container.firstChild.className).toContain('amber');
  });

  it('renders as a div element (shadcn Badge)', () => {
    const { container } = render(<AssetStatusBadge status="active" />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
