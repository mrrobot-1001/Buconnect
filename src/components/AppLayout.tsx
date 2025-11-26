import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto grid grid-cols-12 gap-6 px-4 pt-24 pb-8 max-w-7xl">
        <aside className="hidden md:block md:col-span-3">
          <LeftSidebar />
        </aside>
        <section className="col-span-12 md:col-span-6">
          {children}
        </section>
        <aside className="md:hidden col-span-12 mt-8">
          <RightSidebar />
        </aside>
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-24">
            <RightSidebar />
          </div>
        </aside>
      </main>
    </div>
  );
}
