import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-linen-100 relative overflow-hidden">
      {/* Diner tile floor accent */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, var(--color-butter-300) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--color-bacon-100) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />

      <div className="relative z-10 text-center max-w-2xl">
        <p className="font-dashboard text-sizzle-500 text-sm uppercase tracking-[0.3em] mb-3">
          Welcome to Savoryville
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-bold text-bacon-500 leading-tight mb-2">
          Wake &apos;n Baker&apos;s
        </h1>
        <p className="font-display text-2xl md:text-4xl font-semibold text-skillet-900 mb-8">
          Bacon Makers
        </p>
        <p className="text-lg text-skillet-700 mb-10 leading-relaxed">
          Silent-cartoon kitchen comedy. Three chefs. One pig. The Hospitality
          Score sees what it wants to see.
        </p>
        <Link
          href="/play"
          className="inline-block px-8 py-4 rounded-full bg-bacon-500 text-linen-100 font-display font-semibold text-xl hover:bg-bacon-700 transition-colors shadow-[0_6px_0_var(--color-bacon-700)] hover:shadow-[0_3px_0_var(--color-bacon-700)] hover:translate-y-[3px] active:translate-y-[6px] active:shadow-none"
        >
          Open Restaurant
        </Link>
        <p className="mt-12 text-xs text-skillet-500 font-dashboard uppercase tracking-widest">
          A Savoryville Production · Sprint 1
        </p>
      </div>
    </main>
  );
}
