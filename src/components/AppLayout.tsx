import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto grid grid-cols-12 gap-8 px-4 pt-24">
        <aside className="hidden md:block md:col-span-3">
          <LeftSidebar />
        </aside>
        <section className="col-span-12 md:col-span-6">
          {children}
        </section>
        <aside className="hidden md:block md:col-span-3">
          <RightSidebar />
        </aside>
      </main>
    </div>
  );
}
