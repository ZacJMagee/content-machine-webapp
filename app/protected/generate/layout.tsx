// app/protected/generate/layout.tsx
export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full">
      {/* Override the max-w-5xl constraint for generation pages */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto px-6">
        {children}
      </div>
    </div>
  );
}
