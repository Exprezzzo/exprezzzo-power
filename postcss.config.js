// postcss.config.js
// Corrected format for Next.js 14.2.5 - uses 'plugins' as an object.
// This format should be fully compatible and resolve PostCSS errors for Next.js 14.x.

module.exports = {
  plugins: { // This format is correct for Next.js 14.x
    tailwindcss: {},
    autoprefixer: {},
  },
};