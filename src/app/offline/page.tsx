export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <div className="container-x py-32 text-center">
      <div className="orb mx-auto mb-8 h-24 w-24 animate-float rounded-full" />
      <h1 className="font-display text-3xl font-semibold">You&apos;re offline</h1>
      <p className="mx-auto mt-3 max-w-sm text-white/60">
        Check your connection and try again. Pages you&apos;ve already opened may still be available.
      </p>
    </div>
  );
}
