import Header from "@/components/Header";

type AdminLayoutProps = {
    children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header />
            <main className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
