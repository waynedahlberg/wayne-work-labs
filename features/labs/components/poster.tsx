/**
 * Still image shown in a slot while its live demo loads (or if it never
 * does). It fades out once the host reports `data-ready` (see site.css).
 */
export function Poster({ poster }: { poster: { dark?: string; light?: string } }) {
  if (!poster.dark && !poster.light) return <div aria-hidden className="lab-poster absolute inset-0" />;
  return (
    <>
      {poster.dark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster.dark} alt="" loading="lazy" className={`lab-poster absolute inset-0 size-full object-cover ${poster.light ? "hidden dark:block" : ""}`} />
      )}
      {poster.light && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster.light} alt="" loading="lazy" className={`lab-poster absolute inset-0 size-full object-cover ${poster.dark ? "dark:hidden" : ""}`} />
      )}
    </>
  );
}
