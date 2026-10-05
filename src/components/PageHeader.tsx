import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
};

// Compact page title used on every app page. No card around it, so phones
// keep the first screen for content.
export function PageHeader({ title, description, icon: Icon, backHref, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center gap-3 md:mb-6", className)}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      {Icon && (
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm sm:flex">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Shared look for the segmented tab bars (Network, Connections, Notifications).
export const segmentedList = "grid h-11 w-full rounded-xl bg-gray-100 p-1";
export const segmentedTrigger =
  "h-9 rounded-lg px-2 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm";
