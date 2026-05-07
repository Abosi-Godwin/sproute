import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props}>{children}</div>;
}

export function CardBody({ className, children, ...props }: CardProps) {
  return <div className={cn('px-6 pb-4', className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return <div className={cn('flex items-center px-6 pb-6', className)} {...props}>{children}</div>;
}
