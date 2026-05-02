/**
 * Savoryville palette as Phaser hex ints.
 * Mirror of CSS @theme tokens in apps/web/src/app/globals.css.
 */
export const SAVORYVILLE = {
  bacon50: 0xfbe9e3,
  bacon100: 0xf5cfc1,
  bacon300: 0xd97250,
  bacon500: 0xb23a1a,
  bacon700: 0x8c1f2a,
  bacon900: 0x5a1410,

  butter100: 0xfff3c4,
  butter300: 0xfbe17b,
  butter500: 0xf5c547,
  butter700: 0xc89a23,

  skillet500: 0x6b4d39,
  skillet700: 0x4a3528,
  skillet900: 0x2b201a,

  linen50: 0xfefaf2,
  linen100: 0xfbf3e3,
  linen300: 0xf4e8d6,
  linen500: 0xe0d4b5,

  sizzle300: 0xf4a878,
  sizzle500: 0xe8761f,
  sizzle700: 0xb95514,

  steam300: 0xd5d7d2,
  steam500: 0x9a9d96,

  // Character-specific (from canon key art on @wake.n.bakers.bac)
  hamletPink: 0xf2a98f, // warm salmon, matches canon
  pamTeal: 0x4ab8a8 // Pam Stax dress — promoted from dashboard kitsch to brand
} as const;
