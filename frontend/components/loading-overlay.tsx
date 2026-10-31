type LoadingOverlayProps = {
  label?: string;
};

export default function LoadingOverlay({
  label = "Loading",
}: LoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70"
      role="status"
      aria-label={label}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-100 border-t-red-700" />
    </div>
  );
}
