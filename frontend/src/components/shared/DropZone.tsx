import { useExternalDrop } from '@/hooks/useExternalDrop';
import type { FileCategory } from '@/types/import';

interface DropZoneProps {
  panelId: string;
  children: React.ReactNode;
  className?: string;
  allowedCategories?: FileCategory[];
  onFilesDrop?: (files: any[]) => void;
}

export default function DropZone({ panelId, children, className = '', allowedCategories, onFilesDrop }: DropZoneProps) {
  const ref = useExternalDrop({ panelId, allowedCategories });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
    </div>
  );
}
