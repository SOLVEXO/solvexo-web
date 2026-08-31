import { usePageTitle } from '@/hooks/usePageTitle';
import { LegalPageLayout, type LegalSection } from '@/components/comman/ui';

// Real architecture-level claims only — every statement below describes a
// practice that actually exists in the Solvexo codebase today (auth, rate
// limiting, payments, RBAC, per-store data isolation). No certifications,
// audits, or third-party claims are made here since none have been
// independently verified — this describes engineering practice, not a
// compliance attestation.
const SECTIONS: LegalSection[] = [
  {
    id: 'account-security',
    title: 'Account Security',
    body: [
      'Passwords are never stored in plain text — every password is hashed before it touches our database, and the original is never recoverable, even by us.',
      'New accounts are verified by a one-time code sent to your email before the account can be used, and every sign-in attempt is rate-limited to make automated password-guessing impractical.',
      'Signing in issues a session-backed access token — signing out (or a password reset) immediately revokes that session, rather than waiting for the token to naturally expire.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    body: [
      'Card details are handled directly by Stripe, our payment processor — Solvexo\'s own servers never receive or store your full card number.',
      'Every payment event Stripe sends us is cryptographically verified before we act on it, so a forged or replayed webhook can\'t be used to fake a payment.',
    ],
    callout: { type: 'security', text: 'Card details are handled directly by Stripe — Solvexo\'s own servers never receive or store your full card number.' },
  },
  {
    id: 'access-control',
    title: 'Access Control',
    body: [
      'Every request is checked against what that specific account is actually allowed to do — a buyer, a seller, and an admin each see and can act on a strictly different set of data.',
      'A seller\'s store data — orders, customers, inventory, analytics — is scoped to that seller\'s own account; one seller cannot read or modify another seller\'s store through the platform.',
    ],
  },
  {
    id: 'data-in-transit',
    title: 'Data in Transit',
    body: [
      'All traffic between your browser and Solvexo is encrypted (HTTPS) — nothing is sent in plain text over the network.',
    ],
  },
  {
    id: 'ongoing-practice',
    title: 'Ongoing Practice',
    body: [
      'Security is treated as an ongoing engineering responsibility, not a one-time checklist — access-control and authentication logic are reviewed and hardened as the platform grows, and issues found internally are fixed directly rather than left open.',
      'We don\'t publish a public bug-bounty program today. If you believe you\'ve found a security issue, reach out through the Contact Us page and describe it — we take reports seriously.',
    ],
  },
];

export function SecurityPage() {
  usePageTitle('Security');
  return (
    <LegalPageLayout
      title="Security"
      subtitle="How Solvexo protects your account, your data, and your payments."
      lastUpdated="August 2026"
      sections={SECTIONS}
      relatedPages={[
        { title: 'Privacy Policy', description: 'How Solvexo collects, uses, and protects your information.', path: '/privacy-policy' },
        { title: 'Contact Us', description: 'Reach our team, including to report a security concern.', path: '/contact-us' },
      ]}
    />
  );
}
