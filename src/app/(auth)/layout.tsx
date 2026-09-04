// The new auth pages render their own <AuthLayout> wrapper so they can
// own the gradient hero, aside panel, and responsive behaviour. This
// layout file is kept as a passthrough so the existing routing still
// works unchanged.

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
