// lib/publicRoutes.ts
export const publicRoutes = [
  '/',
  '/pricing',
  '/faq',
  '/contact',
  '/login',
  '/signup',
  '/forgot-password',
  '/about',
  '/features', // Assuming you'll create a features page
  '/docs',
  '/blog',
  '/privacy',
  '/terms',
  '/success',
  '/checkout', // Checkout page is public for guest users
  '/invite' // Invite page is public
];

export const isPublicRoute = (pathname: string): boolean => {
  // Check for exact matches or routes starting with a public path
  return publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
};
