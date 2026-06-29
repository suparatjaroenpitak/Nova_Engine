import { useState } from 'react';

const featured = [
  { name: 'Low Poly Nature Pack', author: 'NatureWorks', price: 'Free', rating: 4.5 },
  { name: 'Fantasy Dungeon Kit', author: 'DungeonCraft', price: '$19.99', rating: 4.8 },
  { name: 'Sci-Fi Weapons Bundle', author: 'BlasterTech', price: '$14.99', rating: 4.3 },
  { name: 'UI Sound Effects', author: 'AudioLab', price: '$9.99', rating: 4.6 },
  { name: 'Particle Effects Pack', author: 'VFXPro', price: 'Free', rating: 4.7 },
  { name: 'Character Animator', author: 'Anim8or', price: '$24.99', rating: 4.4 },
];

export default function AssetStore() {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-nova-border">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="w-full px-3 py-2 bg-nova-bg border border-nova-border rounded text-sm text-nova-text placeholder-nova-muted"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="text-sm font-medium text-white mb-3">Featured Assets</h2>
        <div className="grid grid-cols-2 gap-3">
          {featured
            .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
            .map((asset) => (
              <div
                key={asset.name}
                className="bg-nova-surface border border-nova-border rounded-lg overflow-hidden hover:border-nova-accent/50 transition-colors cursor-pointer"
              >
                <div className="h-24 bg-nova-bg flex items-center justify-center">
                  <span className="text-3xl opacity-20">🎮</span>
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-medium text-white truncate">{asset.name}</h3>
                  <p className="text-xs text-nova-muted">{asset.author}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-nova-accent font-medium">{asset.price}</span>
                    <span className="text-xs text-yellow-400">★ {asset.rating}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
