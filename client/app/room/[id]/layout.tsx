
export default function Layout({
  children
}: { children: React.ReactNode }) {
  return (
    <main className={"bg-slate-950 min-h-screen text-white"}>
      {children}
    </main>
  )
}