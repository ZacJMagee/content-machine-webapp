// app/(auth-pages)/layout.tsx
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-8">
      <div className="w-full max-w-md mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
