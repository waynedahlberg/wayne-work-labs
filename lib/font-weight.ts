// LOCAL PATCH (wayne.work): every token carries Allo's ROND axis so roundness
// stays consistent where FF sets font-variation-settings for weight. Re-apply
// after a Fluid Functionalism update. The value lives in --allo-rond (styles/site.css).
export const fontWeights = {
  normal: "'wght' 400, 'opsz' 14, 'ROND' var(--allo-rond, 25)",
  semibold: "'wght' 550, 'opsz' 18, 'ROND' var(--allo-rond, 25)",
  bold: "'wght' 700, 'opsz' 25, 'ROND' var(--allo-rond, 25)",
} as const;
