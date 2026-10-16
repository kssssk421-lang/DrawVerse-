export interface PresetAvatar {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'cat', name: 'Gatinho', emoji: '🐱', bgColor: 'bg-amber-400' },
  { id: 'robot', name: 'Robô', emoji: '🤖', bgColor: 'bg-cyan-500' },
  { id: 'alien', name: 'Alienígena', emoji: '👽', bgColor: 'bg-lime-500' },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', bgColor: 'bg-zinc-800' },
  { id: 'monster', name: 'Monstrinho', emoji: '👾', bgColor: 'bg-purple-500' },
  { id: 'duck', name: 'Patolino', emoji: '🦆', bgColor: 'bg-yellow-400' },
  { id: 'dino', name: 'Dinossauro', emoji: '🦖', bgColor: 'bg-emerald-500' },
  { id: 'wizard', name: 'Mago', emoji: '🧙‍♂️', bgColor: 'bg-indigo-500' },
  { id: 'skull', name: 'Esqueleto', emoji: '💀', bgColor: 'bg-rose-400' },
  { id: 'artist', name: 'Pintor', emoji: '👨‍🎨', bgColor: 'bg-pink-500' },
  { id: 'fox', name: 'Raposa', emoji: '🦊', bgColor: 'bg-orange-500' },
  { id: 'bear', name: 'Urso', emoji: '🐻', bgColor: 'bg-stone-500' },
];

/**
 * Compresses and crops an image file from the device to a 200x200 square PNG data URL
 */
export async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        // Center crop square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
