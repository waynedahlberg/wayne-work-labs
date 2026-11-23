import { PageTransition } from "@/components/page-transition";
import { LabsTeaser } from "@/features/labs/components/labs-teaser";

export default function Home() {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-6">
        <section className="py-16 sm:py-24">
          <h1 className="max-w-2xl text-display font-semibold tracking-tight">Wayne</h1>
          <p className="mt-3 max-w-xl text-subtitle text-muted-foreground">
            Design engineer. Projects, and a lab of small interface experiments.
          </p>
        </section>
        <LabsTeaser limit={6} />
      </main>
    </PageTransition>
  );
}
