import { ClientApp } from "@/components/ClientApp";

// Every learner-facing URL (/, /carte, /chapitre/…) lives under this layout. The app is mounted
// HERE rather than in the page so it survives navigation between those URLs: a layout isn't
// re-created when only the [[...slug]] below it changes, so the store, animations and the
// chapter-to-chapter "travel" all carry on exactly as before URLs existed.
export default function ParcoursLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ClientApp />
    </>
  );
}
