const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_CONCURRENT = 4;
const RETRY_MAX = 3;

interface ChunkTask {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Blob;
  fileName: string;
  fileSize: number;
  retries: number;
}

export class UploadService {
  private active = new Map<string, AbortController>();
  private queue: ChunkTask[] = [];
  private running = 0;
  private paused = new Set<string>();
  private progress = new Map<string, { loaded: number; total: number; speed: number; startTime: number }>();

  onProgress?: (fileId: string, progress: { loaded: number; total: number; speed: number; eta: number; progress: number }) => void;
  onComplete?: (fileId: string) => void;
  onError?: (fileId: string, error: string) => void;

  async uploadFile(file: File, projectId: string, endpoint: string): Promise<void> {
    const fileId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const controller = new AbortController();
    this.active.set(fileId, controller);
    this.progress.set(fileId, { loaded: 0, total: file.size, speed: 0, startTime: Date.now() });

    const uploadChunk = async (chunkIndex: number): Promise<void> => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const task: ChunkTask = { fileId, chunkIndex, totalChunks, data: chunk, fileName: file.name, fileSize: file.size, retries: 0 };
      this.queue.push(task);
      await this.processQueue(endpoint, projectId, controller.signal);
    };

    const promises = Array.from({ length: totalChunks }, (_, i) => uploadChunk(i));
    await Promise.all(promises);

    await this.finalizeUpload(fileId, file.name, totalChunks, endpoint, projectId, controller.signal);
    this.active.delete(fileId);
    this.progress.delete(fileId);
    this.onComplete?.(fileId);
  }

  private async processQueue(endpoint: string, projectId: string, signal: AbortSignal): Promise<void> {
    while (this.queue.length > 0 && this.running < MAX_CONCURRENT) {
      const task = this.queue.shift()!;
      if (this.paused.has(task.fileId)) {
        this.queue.unshift(task);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      this.running++;
      this.uploadChunk(task, endpoint, projectId, signal).finally(() => {
        this.running--;
        if (this.queue.length > 0) this.processQueue(endpoint, projectId, signal);
      });
    }
    while (this.running > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  private async uploadChunk(task: ChunkTask, endpoint: string, projectId: string, signal: AbortSignal): Promise<void> {
    const formData = new FormData();
    formData.append('file', task.data, task.fileName);
    formData.append('fileId', task.fileId);
    formData.append('chunkIndex', task.chunkIndex.toString());
    formData.append('totalChunks', task.totalChunks.toString());
    formData.append('fileSize', task.fileSize.toString());
    formData.append('projectId', projectId);

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal,
      });

      this.updateProgress(task.fileId, task.data.size);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (task.retries < RETRY_MAX) {
        task.retries++;
        this.queue.push(task);
      } else {
        this.onError?.(task.fileId, `Chunk ${task.chunkIndex} failed after ${RETRY_MAX} retries`);
      }
    }
  }

  private async finalizeUpload(fileId: string, fileName: string, totalChunks: number, endpoint: string, projectId: string, signal: AbortSignal): Promise<void> {
    const token = localStorage.getItem('accessToken');
    await fetch(`${endpoint}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ fileId, fileName, totalChunks, projectId }),
      signal,
    });
  }

  private updateProgress(fileId: string, bytes: number): void {
    const p = this.progress.get(fileId);
    if (!p) return;
    p.loaded += bytes;
    const elapsed = (Date.now() - p.startTime) / 1000;
    p.speed = p.loaded / elapsed;
    const remaining = p.total - p.loaded;
    const eta = p.speed > 0 ? remaining / p.speed : 0;
    this.onProgress?.(fileId, {
      loaded: p.loaded, total: p.total, speed: p.speed, eta, progress: (p.loaded / p.total) * 100,
    });
  }

  pause(fileId: string): void { this.paused.add(fileId); }
  resume(fileId: string): void { this.paused.delete(fileId); }
  cancel(fileId: string): void {
    this.active.get(fileId)?.abort();
    this.active.delete(fileId);
    this.progress.delete(fileId);
    this.queue = this.queue.filter((t) => t.fileId !== fileId);
  }
  cancelAll(): void {
    for (const [id, ctrl] of this.active) { ctrl.abort(); this.active.delete(id); }
    this.queue = [];
    this.progress.clear();
  }
}

export const uploadService = new UploadService();
