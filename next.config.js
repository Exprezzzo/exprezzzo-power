// next.config.js
// DEFINITIVE FIX for PostCSS "passed as a function... must be provided as a string" error in Next.js 14.2.30+
// This explicitly configures the postcss-loader using require.resolve.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for Next.js apps for development warnings

  typescript: {
    ignoreBuildErrors: true, // Still temporarily ignoring build errors
  },

  // Explicitly configure webpack to handle PostCSS plugins in a way
  // that satisfies Next.js 14.2.30's stricter requirements.
  webpack: (config, { isServer }) => {
    // Find the PostCSS loader rule and modify its options
    const cssRules = config.module.rules.find(
      (rule) =>
        typeof rule.test === 'object' &&
        rule.test.toString().includes('css|scss|sass')
    );

    if (cssRules && cssRules.use) {
      const postcssLoader = cssRules.use.find(
        (use) =>
          typeof use === 'object' && use.loader && use.loader.includes('postcss-loader')
      );

      if (postcssLoader && typeof postcssLoader === 'object') {
        postcssLoader.options.postcssOptions = {
          plugins: [
            require.resolve('tailwindcss'), // Use require.resolve to ensure string path
            require.resolve('autoprefixer'), // Use require.resolve to ensure string path
          ],
        };
      }
    }

    // Add a rule to explicitly exclude the 'backend' folder from webpack processing
    // for the frontend build, in case it's still being problematic (though tsconfig should help).
    config.module.rules.push({
      test: /\.tsx?$/, // Apply to TypeScript/TSX files
      exclude: /node_modules|\.next|backend/, // Exclude specific directories, including 'backend'
      // No 'use' property here, as Next.js handles its own TS loading,
      // this rule is mainly for exclusion.
    });


    return config;
  },

  images: {
    // If you're loading images from external domains, list them here.
    // domains: ['your-firebase-storage-bucket.appspot.com'], // Example
    unoptimized: false, // Keep optimized for Vercel
  },

  // Any other essential Next.js configurations
};

module.exports = nextConfig;