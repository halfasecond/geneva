// Only load Tailwind for the $PURR app — other Geneva clients don't use it.
// This also avoids breaking non-Purr dev sessions when node_modules is stale.
const isPurrApp = process.env.VITE_APP === 'purr'

const plugins = {}

if (isPurrApp) {
  try {
    require.resolve('tailwindcss')
    plugins.tailwindcss = {}
  } catch {
    throw new Error(
      'tailwindcss is required for the Purr app. Run `yarn install` (or rebuild the Docker node_modules volume).'
    )
  }
}

try {
  require.resolve('autoprefixer')
  plugins.autoprefixer = {}
} catch {
  // autoprefixer is optional
}

module.exports = { plugins }