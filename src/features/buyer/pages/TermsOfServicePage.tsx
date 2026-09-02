import { usePageTitle } from '@/hooks/usePageTitle';
import { LegalPageLayout, type LegalSection } from '@/components/comman/ui';

// Placeholder content — not reviewed legal copy. Replace with the real
// terms (and keep "Last updated" accurate) before this page is treated as
// binding.
const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: [
      'These Terms of Service ("Terms") govern your access to and use of Solvexo. By creating an account, browsing a store on Solvexo, or making a purchase, you agree to be bound by these Terms.',
      'If you do not agree to these Terms, please do not use Solvexo.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    body: [
      'You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account and make purchases on Solvexo.',
      'By registering, you confirm that the information you provide is accurate and that you\'ll keep it up to date.',
    ],
  },
  {
    id: 'accounts',
    title: 'Account Registration',
    body: [
      'You\'re responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
      'Notify us immediately if you suspect unauthorized use of your account.',
    ],
  },
  {
    id: 'responsibilities',
    title: 'Buyer & Seller Responsibilities',
    body: [
      'Buyers agree to provide accurate shipping and payment information and to review a store\'s listings, policies, and reviews before purchasing.',
      'Sellers agree to accurately describe their products, fulfill orders in a timely manner, and comply with Solvexo\'s seller policies, applicable laws, and consumer-protection requirements.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Fees',
    body: [
      'Prices are set by individual sellers and displayed in the currency shown at checkout. Solvexo may charge sellers a platform fee or commission on completed sales, as described in seller-facing pricing.',
      'Payments are processed through our third-party payment providers; by making a purchase you agree to their applicable terms as well.',
    ],
    callout: { type: 'info', text: 'Payments are processed through our third-party payment providers; by making a purchase you agree to their applicable terms as well.' },
  },
  {
    id: 'returns',
    title: 'Returns, Refunds & Cancellations',
    body: [
      'Return and refund eligibility depends on the specific store\'s policy and the product type (physical, digital, or educational) — check the listing or store page for details.',
      'Digital products are generally non-refundable once accessed or downloaded, except where required by law or expressly stated otherwise.',
    ],
    callout: { type: 'warning', text: 'Digital products are generally non-refundable once accessed or downloaded, except where required by law or expressly stated otherwise.' },
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: [
      'The Solvexo name, logo, and platform design are the property of Solvexo and may not be used without permission.',
      'Sellers retain ownership of their own product content (images, descriptions, digital files) but grant Solvexo a license to display and distribute it for the purpose of operating their store on the Solvexo platform.',
    ],
  },
  {
    id: 'prohibited-conduct',
    title: 'Prohibited Conduct',
    body: [
      'You may not use Solvexo to list counterfeit, illegal, or infringing goods, to defraud buyers or sellers, or to circumvent platform fees or safety features.',
      'We reserve the right to suspend or terminate accounts that violate these Terms or engage in abusive, fraudulent, or unlawful behavior.',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: [
      'Solvexo provides the platform "as is." To the fullest extent permitted by law, Solvexo is not liable for indirect, incidental, or consequential damages arising from your use of the platform, or from transactions between buyers and sellers.',
    ],
    callout: { type: 'warning', text: 'Solvexo provides the platform "as is." To the fullest extent permitted by law, Solvexo is not liable for indirect, incidental, or consequential damages arising from your use of the platform, or from transactions between buyers and sellers.' },
  },
  {
    id: 'termination',
    title: 'Termination',
    body: [
      'You may close your account at any time from your account settings. We may suspend or terminate access to Solvexo for violations of these Terms, with or without notice, depending on severity.',
    ],
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    body: [
      'These Terms are governed by the laws of the jurisdiction in which Solvexo is registered, without regard to conflict-of-law principles, unless otherwise required by applicable local consumer-protection law.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: [
      'Questions about these Terms can be directed to our support team through the Help Center or Contact Us page.',
    ],
  },
];

export function TermsOfServicePage() {
  usePageTitle('Terms of Service');
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The rules and guidelines for using Solvexo as a buyer or seller."
      lastUpdated="July 24, 2026"
      sections={SECTIONS}
      relatedPages={[
        { title: 'Privacy Policy', description: 'How Solvexo collects, uses, and protects your information.', path: '/privacy-policy' },
      ]}
    />
  );
}
