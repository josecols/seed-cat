import clsx from 'clsx';

export function DescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      {...props}
      className={clsx(
        className,
        'grid grid-cols-1 text-sm/6 sm:grid-cols-[auto,1fr] sm:gap-x-4 sm:gap-y-2'
      )}
    />
  );
}

export function DescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt {...props} className={clsx(className, 'col-start-1 text-zinc-500')} />
  );
}

export function DescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'dd'>) {
  return <dd {...props} className={clsx(className, 'text-zinc-950')} />;
}
