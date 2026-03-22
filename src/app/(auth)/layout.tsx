export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-full items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, oklch(0.97 0.01 270) 0%, oklch(0.99 0.005 200) 50%, oklch(0.97 0.01 330) 100%)" }}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
