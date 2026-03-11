'use client';
import { cn } from "@/lib/utils";

export const BentoGrid = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-4 max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
};

export const BentoItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-sm p-4 bg-card border border-white/10 justify-between flex flex-col space-y-4 cursor-pointer",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-bold text-neutral-600 dark:text-neutral-200 mb-1 mt-2">
          {title}
        </div>
        <div className="font-normal text-neutral-600 text-xs dark:text-neutral-300">
          {description}
        </div>
      </div>
    </div>
  );
};