import { useImportStore } from '@/stores/importStore';
import { FILE_CATEGORY_ICONS } from '@/types/import';

export default function FileDropOverlay() {
  const isDragging = useImportStore((s) => s.isDragging);
  const dragCount = useImportStore((s) => s.dragCount);
  const dragCategories = useImportStore((s) => s.dragCategories);
  const dragOverPanel = useImportStore((s) => s.dragOverPanel);
  const dismissDrop = useImportStore((s) => s.dismissDrop);

  if (!isDragging) return null;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="drop-overlay-active fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute inset-0 bg-[#e94560]/5 backdrop-blur-[2px]" />
      <div className="absolute inset-0 border-2 border-dashed border-[#e94560]/50 m-2 rounded-lg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-[#e94560]/20 flex items-center justify-center border-2 border-[#e94560]/40">
            <svg className="w-10 h-10 text-[#e94560]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-white text-sm font-medium">Drop Files Here</div>
            <div className="text-[#8a8aaa] text-[11px] mt-1">
              {dragCount} file{dragCount !== 1 ? 's' : ''} • {dragCategories.map((c) => FILE_CATEGORY_ICONS[c] || c).join(' ')}
            </div>
            {dragOverPanel && (
              <div className="text-[#6a6a8a] text-[9px] mt-0.5">
                Drop to: <span className="text-[#e94560] capitalize">{dragOverPanel.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={dismissDrop}
        className="pointer-events-auto absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1a1a35] border border-[#2a2a4a] flex items-center justify-center text-[#6a6a8a] hover:text-white hover:border-[#e94560]/50"
      >
        ✕
      </button>
    </div>
  );
}
