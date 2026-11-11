export default [
  {
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["packages/document-engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@temin360/document-templates",
                "**/document-templates/**",
              ],
              message:
                "DocumentEngine genel bir motordur; @temin360/document-templates paketine bağımlı olamaz.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/document-templates/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "apps/*",
                "**/apps/**",
                "@renderer/*",
                "**/renderer/**",
                "**/services/**",
                "**/store/**",
              ],
              message:
                "@temin360/document-templates paketi uygulama katmanına (apps/*, renderer, services, store) bağımlı olamaz. Bağımlılık yönü daima uygulama -> paket olmalıdır.",
            },
          ],
        },
      ],
    },
  },
];