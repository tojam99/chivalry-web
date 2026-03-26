/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pkekuxksofbzjrieesqm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/support.html', destination: '/support', permanent: true },
      { source: '/safety.html', destination: '/support', permanent: true },
      { source: '/email-verified.html', destination: '/email-verified', permanent: true },
    ];
  },
};

module.exports = nextConfig;
