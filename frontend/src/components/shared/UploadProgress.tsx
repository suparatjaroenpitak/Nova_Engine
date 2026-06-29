import { useImportStore } from '@/stores/importStore';

export default function UploadProgress() {
  const importJobs = useImportStore((s) => s.importJobs);
  const activeJobId = useImportStore((s) => s.activeJobId);
  const cancelJob = useImportStore((s) => s.cancelJob);

  const active = importJobs.filter((j) => ['queued', 'validating', 'importing', 'optimizing', 'generating'].includes(j.status));

  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9997] w-80 space-y-1">
      {active.map((job) => (
        <div key={job.id} className="bg-[#1a1a35] border border-[#2a2a4a] rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#e8e8f0] font-medium">
                {job.status === 'queued' && '⏳ Queued'}
                {job.status === 'validating' && '🔍 Validating'}
                {job.status === 'importing' && '📦 Importing'}
                {job.status === 'optimizing' && '⚙ Optimizing'}
                {job.status === 'generating' && '🖼 Generating'}
              </span>
            </div>
            <button onClick={() => cancelJob(job.id)} className="text-[#6a6a8a] hover:text-red-400 text-[9px]">Cancel</button>
          </div>
          <div className="text-[9px] text-[#6a6a8a] mb-1.5">{job.files.length} file{job.files.length !== 1 ? 's' : ''}</div>
          <div className="w-full h-1.5 bg-[#0a0a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e94560] to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="text-[8px] text-[#4a4a6a] mt-0.5 text-right">{job.progress}%</div>
        </div>
      ))}
    </div>
  );
}
