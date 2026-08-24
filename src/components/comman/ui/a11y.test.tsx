import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Field } from './Field';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { Badge } from './Badge';

// Real automated accessibility validation (axe-core) against the shared UI
// primitives every workspace/storefront surface is built from — not a
// full-page/E2E scan (no live browser in this environment, see the
// project's Lighthouse CI note), but a genuine, real check that catches
// structural a11y regressions (missing labels, bad contrast-independent
// roles, invalid ARIA) in the building blocks reused everywhere.
describe('accessibility — shared UI primitives', () => {
  it('Field + input has no violations', async () => {
    const { container } = render(
      <Field label="Email address" hint="We'll never share this.">
        <input type="email" />
      </Field>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Field in required/error state has no violations', async () => {
    const { container } = render(
      <Field label="Password" required error="Password is required">
        <input type="password" />
      </Field>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Button has no violations', async () => {
    const { container } = render(<Button onClick={() => {}}>Save changes</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('disabled Button has no violations', async () => {
    const { container } = render(<Button disabled onClick={() => {}}>Save changes</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Toggle has no violations', async () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} ariaLabel="Enable notifications" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Badge has no violations', async () => {
    const { container } = render(<Badge color="green">Active</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
