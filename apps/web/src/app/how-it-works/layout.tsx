import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'The vouch loop, the two-track model, and our honest anti-sybil design.',
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
