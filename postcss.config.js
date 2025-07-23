// postcss.config.js
// Corrected format for Next.js 14.2.x - uses 'plugins' as an object.
// This should resolve the "PostCSS Plugin was passed as a function... must be provided as a string" error.

module.exports = {
  plugins: { // This format is correct for Next.js 14.x
    tailwindcss: {},
    autoprefixer: {},
  },
};