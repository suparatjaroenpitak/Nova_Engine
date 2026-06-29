import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import type { CreateProjectRequest } from '@/types';

function ProjectCard({ project, onOpen }: { project: any; onOpen: () => void }) {
  const bgColors = ['from-[#e94560]/20 to-[#0f3460]/20', 'from-[#2ecc71]/20 to-[#0f3460]/20', 'from-[#f39c12]/20 to-[#0f3460]/20', 'from-[#9b59b6]/20 to-[#0f3460]/20'];
  const color = bgColors[project.name.length % bgColors.length];

  return (
    <button
      onClick={onOpen}
      className="group relative rounded-xl overflow-hidden border border-[#2a2a4a] hover:border-nova-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-nova-accent/10 text-left animate-fade-up"
    >
      <div className={`h-32 bg-gradient-to-br ${color} flex items-center justify-center`}>
        <div className="w-12 h-12 rounded-xl bg-[#1a1a3e]/60 backdrop-blur flex items-center justify-center">
          <span className="text-2xl font-bold text-nova-accent">{project.name[0].toUpperCase()}</span>
        </div>
      </div>
      <div className="p-4 bg-nova-surface">
        <h3 className="font-semibold text-nova-text text-sm truncate">{project.name}</h3>
        <p className="text-xs text-nova-muted mt-1 truncate">{project.description || 'No description'}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-nova-muted">
          <span>{project.is3D ? '3D' : '2D'}</span>
          <span className="w-1 h-1 rounded-full bg-nova-border" />
          <span>{project.renderPipeline || 'URP'}</span>
        </div>
      </div>
    </button>
  );
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createProject, loading } = useProjectStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [is3D, setIs3D] = useState(true);
  const [renderPipeline, setRenderPipeline] = useState('URP');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createProject({ name, description, is3D, renderPipeline } as CreateProjectRequest);
    onClose();
    setName('');
    setDescription('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass rounded-2xl p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-nova-text mb-4">New Project</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Game"
              className="w-full px-4 py-2.5 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description..."
              rows={2}
              className="w-full px-4 py-2.5 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIs3D(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${is3D ? 'bg-nova-accent text-white' : 'bg-[#0a0a1a]/50 border border-[#2a2a4a] text-nova-muted hover:text-nova-text'}`}
                >
                  3D
                </button>
                <button
                  onClick={() => setIs3D(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${!is3D ? 'bg-nova-accent text-white' : 'bg-[#0a0a1a]/50 border border-[#2a2a4a] text-nova-muted hover:text-nova-text'}`}
                >
                  2D
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Pipeline</label>
              <select
                value={renderPipeline}
                onChange={(e) => setRenderPipeline(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text text-xs focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
              >
                <option>URP</option>
                <option>HDRP</option>
                <option>Built-in</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={!name.trim() || loading} className="btn-primary flex-1 py-2 rounded-lg text-sm disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { projects, loading, error, loadProjects, deleteProject } = useProjectStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => { loadProjects(); }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (searchTerm) {
      list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAtUtc || 0).getTime() - new Date(a.createdAtUtc || 0).getTime());
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAtUtc || 0).getTime() - new Date(b.createdAtUtc || 0).getTime());
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [projects, searchTerm, sortBy]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a1a] overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[#2a2a4a] bg-nova-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nova-accent to-[#d6304a] flex items-center justify-center">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <h1 className="text-lg font-bold gradient-text hidden sm:block">Nova Engine</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted text-xs">🔍</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-48 lg:w-64 pl-8 pr-3 py-1.5 bg-[#0a0a1a]/60 border border-[#2a2a4a] rounded-lg text-sm text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-nova-accent/20 border border-nova-accent/30 flex items-center justify-center">
              <span className="text-xs font-medium text-nova-accent">{user?.email?.[0].toUpperCase() || 'U'}</span>
            </div>
            <span className="text-sm text-nova-text hidden sm:block">{user?.email}</span>
          </div>
          <button onClick={logout} className="text-xs text-nova-muted hover:text-nova-accent transition-colors px-2 py-1">Logout</button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-nova-text">Projects</h2>
              <p className="text-sm text-nova-muted mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-sm text-nova-text focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary px-4 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                + New Project
              </button>
            </div>
          </div>

          {/* Search on mobile */}
          <div className="relative md:hidden mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nova-muted text-xs">🔍</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-3 py-2 bg-[#0a0a1a]/60 border border-[#2a2a4a] rounded-lg text-sm text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-6 animate-fade-in">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-nova-accent/30 border-t-nova-accent rounded-full animate-spin" />
                <span className="text-sm text-nova-muted">Loading projects...</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nova-accent/10 to-nova-accent2/10 border border-[#2a2a4a] flex items-center justify-center mb-4">
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-lg font-semibold text-nova-text">No projects yet</h3>
              <p className="text-sm text-nova-muted mt-1 mb-4">
                {searchTerm ? 'No projects match your search' : 'Create your first project to get started'}
              </p>
              {!searchTerm && (
                <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2 rounded-lg text-sm">
                  Create Project
                </button>
              )}
            </div>
          )}

          {/* Project grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((project, i) => (
                <div key={project.id} className="group" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProjectCard project={project} onOpen={() => navigate(`/editor/${project.id}`)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
