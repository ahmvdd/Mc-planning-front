// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // Définissez vos polices préférées ici
        sans: ['Inter', 'sans-serif'], // Exemple
        mono: ['JetBrains Mono', 'monospace'], // Très pro pour les labels
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
}