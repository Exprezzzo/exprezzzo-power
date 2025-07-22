// postcss.config.js
// Confirmed for use with tailwindcss@3.3.0, postcss@8.4.31, autoprefixer@10.4.14
// Assumes @tailwindcss/postcss is NOT installed (or explicitly uninstalled).

module.exports = {
  plugins: {
    tailwindcss: {}, // Use the standard tailwindcss plugin
    autoprefixer: {},
  },
};