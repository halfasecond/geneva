// Only load Tailwind for the $PURR app — other Geneva clients don't use it.
// This also avoids breaking non-Purr dev sessions when node_modules is stale.
const isTailwindApp = ['purr'].includes(process.env.VITE_APP)

const plugins = {}

if (isTailwindApp) {
  try {
    require.resolve('tailwindcss')
    plugins.tailwindcss = {}
  } catch {
    throw new Error(
      'tailwindcss is required for Tailwind apps (purr, kittyFamily). Run `yarn install` (or rebuild the Docker node_modules volume).'
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