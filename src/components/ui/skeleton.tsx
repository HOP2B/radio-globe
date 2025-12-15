"use client";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse around-full bg-primary/10 ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
