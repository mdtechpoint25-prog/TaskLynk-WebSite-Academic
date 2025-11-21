import type { Metadata } from 'next';
import { siteConfig } from './seo-config';

/**
 * Generate metadata with canonical URL for any page
 * Prevents duplicate content penalties across multiple domains
 */
export function generateCanonicalMetadata(
  path: string = '',
  customMetadata?: Partial<Metadata>
): Metadata {
  const canonicalUrl = `${siteConfig.url}${path}`;

  return {
    ...customMetadata,
    alternates: {
      canonical: canonicalUrl,
      ...customMetadata?.alternates,
    },
    openGraph: {
      url: canonicalUrl,
      ...customMetadata?.openGraph,
    },
    twitter: {
      ...customMetadata?.twitter,
    },
  };
}
