/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/admin/:path*',
          destination: '/login',
          permanent: false,
        },
        {
          source: '/staff/:path*',
          destination: '/login',
          permanent: false,
        },
      ];
    },
  };
  
  export default nextConfig;
