self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'validate': {
      const results = payload.files.map((f: any) => ({
        id: f.id,
        valid: true,
        errors: [] as string[],
      }));
      self.postMessage({ type: 'validationResult', payload: results });
      break;
    }

    case 'generateThumbnail': {
      try {
        const bitmap = await createImageBitmap(payload.file);
        const canvas = new OffscreenCanvas(128, 128);
        const ctx = canvas.getContext('2d')!;
        const scale = Math.min(128 / bitmap.width, 128 / bitmap.height);
        const x = (128 - bitmap.width * scale) / 2;
        const y = (128 - bitmap.height * scale) / 2;
        ctx.drawImage(bitmap, x, y, bitmap.width * scale, bitmap.height * scale);
        const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
        self.postMessage({ type: 'thumbnailResult', payload: { fileId: payload.fileId, blob } });
        bitmap.close();
      } catch {
        self.postMessage({ type: 'thumbnailResult', payload: { fileId: payload.fileId, blob: null } });
      }
      break;
    }

    case 'computeHash': {
      const buffer = payload.data as ArrayBuffer;
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      self.postMessage({ type: 'hashResult', payload: { fileId: payload.fileId, hash: hashHex } });
      break;
    }

    case 'analyzeDependencies': {
      const modelFiles = payload.files.filter((f: any) => f.category === 'model');
      const textureFiles = payload.files.filter((f: any) => f.category === 'texture');
      const materialFiles = payload.files.filter((f: any) => f.category === 'material');

      const deps = modelFiles.map((f: any) => {
        const baseName = f.name.replace(/\.[^.]+$/, '').toLowerCase();
        const relatedTextures = textureFiles.filter((t: any) =>
          t.name.toLowerCase().includes(baseName) ||
          baseName.includes(t.name.replace(/\.[^.]+$/, '').toLowerCase())
        );
        const relatedMaterials = materialFiles.filter((m: any) =>
          m.name.toLowerCase().includes(baseName)
        );
        return {
          fileId: f.id,
          dependencies: [
            ...relatedTextures.map((t: any) => ({ id: t.id, type: 'texture', name: t.name })),
            ...relatedMaterials.map((m: any) => ({ id: m.id, type: 'material', name: m.name })),
          ],
        };
      });

      self.postMessage({ type: 'dependencyResult', payload: deps });
      break;
    }
  }
};
