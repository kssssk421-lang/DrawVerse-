import React, { useState, useRef } from 'react';
import { PRESET_AVATARS, processImageFile, PresetAvatar } from '../utils/avatars';
import { Camera, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { sounds } from '../utils/sound';

interface ProfileModalProps {
  initialName: string;
  initialAvatar: string;
  onSave: (name: string, avatar: string) => void;
  onClose?: () => void;
  isFirstTime?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  initialName,
  initialAvatar,
  onSave,
  onClose,
  isFirstTime = false,
}) => {
  const [name, setName] = useState(initialName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar || 'cat');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(
    initialAvatar?.startsWith('data:image') ? initialAvatar : null
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      sounds.playPop();
      const processedUrl = await processImageFile(file);
      setCustomAvatarUrl(processedUrl);
      setSelectedAvatar(processedUrl);
    } catch (err) {
      console.error('Error processing gallery image', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sounds.playPop();
    onSave(name.trim(), selectedAvatar);
  };

  // Helper to render avatar thumbnail
  const renderAvatarPreview = (avatarStr: string) => {
    if (avatarStr.startsWith('data:image')) {
      return (
        <img
          src={avatarStr}
          alt="Avatar customizado"
          className="w-full h-full object-cover rounded-2xl"
        />
      );
    }
    const preset = PRESET_AVATARS.find((p) => p.id === avatarStr) || PRESET_AVATARS[0];
    return (
      <div className={`w-full h-full ${preset.bgColor} rounded-2xl flex items-center justify-center text-4xl shadow-md`}>
        {preset.emoji}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black font-fredoka tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
            {isFirstTime ? 'Bem-vindo ao DRAWVERSE!' : 'Seu Perfil de Artista'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Escolha seu nome e o visual do seu personagem para começar a jogar!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Active Preview */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 p-1.5 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 shadow-xl mb-2">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800">
                {renderAvatarPreview(selectedAvatar)}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
                title="Carregar da galeria"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              {selectedAvatar.startsWith('data:') ? 'Foto da Galeria' : 'Avatar Selecionado'}
            </span>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Seu Nome ou Apelido
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rabiscador99, MestreTinta..."
              className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-base font-medium"
            />
          </div>

          {/* Preset Avatars or Custom Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Escolha um Personagem
              </label>

              {/* Upload from device gallery button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isProcessingImage ? 'Carregando...' : 'Pegar da Galeria'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Grid of preset avatars */}
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-800/50 rounded-2xl border border-slate-700/60">
              {/* If custom image exists, show it first */}
              {customAvatarUrl && (
                <button
                  type="button"
                  onClick={() => { sounds.playPop(); setSelectedAvatar(customAvatarUrl); }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedAvatar === customAvatarUrl
                      ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/30'
                      : 'border-transparent hover:border-slate-500'
                  }`}
                >
                  <img src={customAvatarUrl} alt="Custom" className="w-full h-full object-cover" />
                  {selectedAvatar === customAvatarUrl && (
                    <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              )}

              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => { sounds.playPop(); setSelectedAvatar(preset.id); }}
                    className={`relative aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${preset.bgColor} ${
                      isSelected
                        ? 'ring-3 ring-amber-400 scale-105 shadow-md'
                        : 'opacity-85 hover:opacity-100 hover:scale-102'
                    }`}
                    title={preset.name}
                  >
                    <span>{preset.emoji}</span>
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isProcessingImage}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-orange-500/25 active:scale-98 transition-all disabled:opacity-50 text-base"
            >
              {isFirstTime ? 'Entrar no DRAWVERSE 🎨' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
