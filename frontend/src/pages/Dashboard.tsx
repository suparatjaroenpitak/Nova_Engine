import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { projects, loadProjects, createProject, selectProject, loading } = useProjectStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [is3D, setIs3D] = useState(true);

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({ name: name.trim(), is3D });
    setShowCreate(false);
    setName('');
    navigate(`/editor/${project.id}`);
  };

  const handleOpen = async (id: string) => {
    await selectProject(id);
    navigate(`/editor/${id}`);
  };

  return (
    <div className="h-screen bg-nova-bg flex flex-col">
      <header className="h-12 bg-nova-surface border-b border-nova-border flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-white">Nova Engine</h1>
        <div className="flex items-center gap-3">
          <span className="text-nova-muted text-sm">{user?.displayName}</span>
          <button onClick={logout} className="text-nova-muted hover:text-nova-text text-sm">Logout</button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Projects</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-nova-accent hover:bg-red-600 text-white rounded text-sm transition-colors"
            >
              + New Project
            </button>
          </div>

          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-nova-surface border border-nova-border rounded-lg"
            >
              <h3 className="text-white font-medium mb-3">Create Project</h3>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 bg-nova-bg border border-nova-border rounded text-nova-text mb-3"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 text-nova-muted text-sm">
                  <input type="radio" checked={is3D} onChange={() => setIs3D(true)} /> 3D
                </label>
                <label className="flex items-center gap-2 text-nova-muted text-sm">
                  <input type="radio" checked={!is3D} onChange={() => setIs3D(false)} /> 2D
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="px-4 py-1.5 bg-nova-accent text-white rounded text-sm">Create</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 bg-nova-surface2 text-nova-text rounded text-sm">Cancel</button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="text-nova-muted text-center py-12">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-nova-muted text-center py-12">
              <p className="text-lg mb-2">No projects yet</p>
              <p className="text-sm">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleOpen(project.id)}
                  className="p-4 bg-nova-surface border border-nova-border rounded-lg cursor-pointer hover:border-nova-accent/50 transition-colors"
                >
                  <div className="w-full h-32 bg-nova-bg rounded mb-3 flex items-center justify-center">
                    <span className="text-4xl opacity-20">{project.is3D ? '3D' : '2D'}</span>
                  </div>
                  <h3 className="text-white font-medium">{project.name}</h3>
                  <p className="text-nova-muted text-xs mt-1">{project.sceneCount} scenes</p>
                  <p className="text-nova-muted text-xs">{new Date(project.createdAtUtc).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
