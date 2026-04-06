type QuantumStatusProps = {
  mode: "superposition" | "entangled" | "collapsed";
};

export default function QuantumStatus({ mode }: QuantumStatusProps) {
  const label =
    mode === "collapsed"
      ? "Measurement: collapsed state"
      : mode === "entangled"
      ? "Entanglement: non-local linkage active"
      : "Superposition: unstable body state";

  return (
    <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
      {label}
    </div>
  );
}