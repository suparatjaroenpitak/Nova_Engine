import { create } from 'zustand';
import type { AssetDto } from '@/types';
import { assetsApi } from '@/api/assets';

interface AssetState {
  assets: AssetDto[];
  selectedAsset: AssetDto | null;
  loading: boolean;
  loadAssets: (projectId: string) => Promise<void>;
  uploadAsset: (projectId: string, name: string, path: string, file: File) => Promise<AssetDto>;
  deleteAsset: (id: string) => Promise<void>;
  selectAsset: (asset: AssetDto | null) => void;
}

export const useAssetStore = create<AssetState>()((set) => ({
  assets: [],
  selectedAsset: null,
  loading: false,

  loadAssets: async (projectId) => {
    set({ loading: true });
    try {
      const { data } = await assetsApi.list(projectId);
      set({ assets: data });
    } finally {
      set({ loading: false });
    }
  },

  uploadAsset: async (projectId, name, path, file) => {
    const { data } = await assetsApi.upload(projectId, name, path, file);
    set((s) => ({ assets: [...s.assets, data] }));
    return data;
  },

  deleteAsset: async (id) => {
    await assetsApi.delete(id);
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
  },

  selectAsset: (asset) => set({ selectedAsset: asset }),
}));
