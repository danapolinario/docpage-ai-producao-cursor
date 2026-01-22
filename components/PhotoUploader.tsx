import React, { useRef, useState, useEffect } from 'react';

interface Props {
  photoUrl: string | null;
  aboutPhotoUrl?: string | null; // Added prop for secondary photo
  onPhotoChange: (url: string) => void | Promise<void>;
  onAboutPhotoChange?: (url: string) => void | Promise<void>; // Handler para upload manual da foto de consultório
  onEnhance: (originalUrl: string) => void;
  onGenerateOfficePhoto?: () => void | Promise<void>; // Handler para gerar foto de consultório por IA
  isEnhanced: boolean;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const PhotoUploader: React.FC<Props> = ({ 
  photoUrl, 
  aboutPhotoUrl,
  onPhotoChange, 
  onAboutPhotoChange,
  onEnhance, 
  onGenerateOfficePhoto,
  isEnhanced,
  onNext, 
  onBack,
  isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aboutFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const aboutVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aboutCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [aboutDragActive, setAboutDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAboutCameraOpen, setIsAboutCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [aboutCameraError, setAboutCameraError] = useState<string | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAboutCamera();
    };
  }, []);

  const handleFile = (file: File, isAbout: boolean = false) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isAbout && onAboutPhotoChange) {
          onAboutPhotoChange(reader.result as string);
        } else {
          onPhotoChange(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], false);
    }
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], true);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], false);
    }
  };

  const handleAboutDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAboutDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], true);
    }
  };

  // --- Camera Logic ---

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      // No mobile, preferir proporção vertical (portrait) para corresponder à imagem da landing page
      const isMobile = window.innerWidth < 768;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          // Mobile: proporção vertical (3:4) | Desktop: manter horizontal
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 960 : 720 },
          aspectRatio: isMobile ? 3/4 : undefined
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // --- Camera Logic for About Photo ---
  const startAboutCamera = async () => {
    setAboutCameraError(null);
    setIsAboutCameraOpen(true);
    try {
      const isMobile = window.innerWidth < 768;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 960 : 720 },
          aspectRatio: isMobile ? 3/4 : undefined
        } 
      });
      if (aboutVideoRef.current) {
        aboutVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setAboutCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsAboutCameraOpen(false);
    }
  };

  const stopAboutCamera = () => {
    if (aboutVideoRef.current && aboutVideoRef.current.srcObject) {
      const stream = aboutVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      aboutVideoRef.current.srcObject = null;
    }
    setIsAboutCameraOpen(false);
  };

  const captureAboutPhoto = () => {
    if (aboutVideoRef.current && aboutCanvasRef.current) {
      const video = aboutVideoRef.current;
      const canvas = aboutCanvasRef.current;
      
      const isMobile = window.innerWidth < 768;
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;
      
      if (isMobile) {
        const targetAspectRatio = 3 / 4;
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        
        if (videoAspectRatio > targetAspectRatio) {
          targetWidth = Math.round(video.videoHeight * targetAspectRatio);
          targetHeight = video.videoHeight;
        } else {
          targetWidth = video.videoWidth;
          targetHeight = Math.round(video.videoWidth / targetAspectRatio);
        }
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        const sourceX = isMobile && video.videoWidth > targetWidth 
          ? Math.round((video.videoWidth - targetWidth) / 2) 
          : 0;
        const sourceY = isMobile && video.videoHeight > targetHeight 
          ? Math.round((video.videoHeight - targetHeight) / 2) 
          : 0;
        const sourceWidth = isMobile ? targetWidth : video.videoWidth;
        const sourceHeight = isMobile ? targetHeight : video.videoHeight;
        
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(
          video, 
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvas.width, canvas.height
        );
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (onAboutPhotoChange) {
          onAboutPhotoChange(dataUrl);
        }
        stopAboutCamera();
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // No mobile, manter proporção vertical (3:4) para corresponder à landing page
      const isMobile = window.innerWidth < 768;
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;
      
      if (isMobile) {
        // Calcular dimensões para proporção 3:4 (portrait)
        const targetAspectRatio = 3 / 4;
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        
        if (videoAspectRatio > targetAspectRatio) {
          // Video é mais largo, ajustar largura
          targetWidth = Math.round(video.videoHeight * targetAspectRatio);
          targetHeight = video.videoHeight;
        } else {
          // Video é mais alto, ajustar altura
          targetWidth = video.videoWidth;
          targetHeight = Math.round(video.videoWidth / targetAspectRatio);
        }
      }
      
      // Set canvas dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Calcular posição para centralizar e cortar se necessário
        const sourceX = isMobile && video.videoWidth > targetWidth 
          ? Math.round((video.videoWidth - targetWidth) / 2) 
          : 0;
        const sourceY = isMobile && video.videoHeight > targetHeight 
          ? Math.round((video.videoHeight - targetHeight) / 2) 
          : 0;
        const sourceWidth = isMobile ? targetWidth : video.videoWidth;
        const sourceHeight = isMobile ? targetHeight : video.videoHeight;
        
        // Flip horizontally if using front camera for mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        // Draw image with crop if needed
        context.drawImage(
          video, 
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvas.width, canvas.height
        );
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onPhotoChange(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
          Sua Foto Profissional
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Input Methods - Foto de Perfil */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Foto de Perfil</h3>
              <p className="text-gray-600 text-sm">
                Escolha como deseja enviar sua foto. Se não tiver uma foto profissional, nossa IA (Nano Banana) irá transformá-la.
              </p>
            </div>

            {isCameraOpen ? (
              <div className="bg-black rounded-xl overflow-hidden relative aspect-[3/4] md:aspect-video flex items-center justify-center max-w-full mx-auto">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button 
                    onClick={stopCamera}
                    className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-12 h-12 bg-white rounded-full border-4 border-gray-300 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                  >
                     <div className="w-10 h-10 bg-white rounded-full border-2 border-black"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Drag and Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer relative group ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleChange}
                  />
                  <div className="mx-auto w-12 h-12 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Upload do Dispositivo</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                </div>

                <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider">OU</div>

                {/* Camera Button */}
                <button
                  onClick={startCamera}
                  className="w-full py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                >
                  <svg className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tirar Foto Agora
                </button>
              </div>
            )}

            {cameraError && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                {cameraError}
              </p>
            )}

            {/* Seção de Foto de Consultório - Desktop (dentro da mesma coluna) */}
            <div className="hidden md:block mt-8 pt-8 border-t border-gray-200 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Foto de Consultório</h3>
                <p className="text-gray-600 text-sm">
                  Opcional: Envie uma foto do consultório ou gere uma imagem por IA.
                </p>
              </div>

              {isAboutCameraOpen ? (
                <div className="bg-black rounded-xl overflow-hidden relative aspect-video flex items-center justify-center max-w-full mx-auto">
                  <video 
                    ref={aboutVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <canvas ref={aboutCanvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button 
                      onClick={stopAboutCamera}
                      className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={captureAboutPhoto}
                      className="w-12 h-12 bg-white rounded-full border-4 border-gray-300 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                    >
                      <div className="w-10 h-10 bg-white rounded-full border-2 border-black"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drag and Drop Area para Foto de Consultório */}
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative group ${
                      aboutDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setAboutDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setAboutDragActive(false); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleAboutDrop}
                    onClick={() => aboutFileInputRef.current?.click()}
                  >
                    <input 
                      ref={aboutFileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAboutChange}
                    />
                    <div className="mx-auto w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Upload do Dispositivo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                  </div>

                  <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider">OU</div>

                  {/* Camera Button para Foto de Consultório */}
                  <button
                    onClick={startAboutCamera}
                    className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tirar Foto Agora
                  </button>

                  {/* Botão Gerar por IA */}
                  {photoUrl && onGenerateOfficePhoto && (
                    <>
                      <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider">OU</div>
                      <button
                        onClick={onGenerateOfficePhoto}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Gerando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="font-semibold">Gerar imagem por IA</span>
                          </>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                      </button>
                      <p className="text-[10px] text-center text-gray-400">
                        A IA criará uma imagem do consultório baseada na sua foto de perfil.
                      </p>
                    </>
                  )}
                </div>
              )}

              {aboutCameraError && (
                <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                  {aboutCameraError}
                </p>
              )}
            </div>

            {/* Seção de Foto de Consultório - Visível no mobile */}
            <div className="md:hidden mt-8 pt-8 border-t border-gray-200 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Foto de Consultório</h3>
                <p className="text-gray-600 text-sm">
                  Opcional: Envie uma foto do consultório ou gere uma imagem por IA.
                </p>
              </div>

              {isAboutCameraOpen ? (
                <div className="bg-black rounded-xl overflow-hidden relative aspect-[3/4] flex items-center justify-center max-w-full mx-auto">
                  <video 
                    ref={aboutVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <canvas ref={aboutCanvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button 
                      onClick={stopAboutCamera}
                      className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={captureAboutPhoto}
                      className="w-12 h-12 bg-white rounded-full border-4 border-gray-300 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                    >
                      <div className="w-10 h-10 bg-white rounded-full border-2 border-black"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drag and Drop Area para Foto de Consultório */}
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative group ${
                      aboutDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setAboutDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setAboutDragActive(false); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleAboutDrop}
                    onClick={() => aboutFileInputRef.current?.click()}
                  >
                    <input 
                      ref={aboutFileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAboutChange}
                    />
                    <div className="mx-auto w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Upload do Dispositivo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                  </div>

                  <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider">OU</div>

                  {/* Camera Button para Foto de Consultório */}
                  <button
                    onClick={startAboutCamera}
                    className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tirar Foto Agora
                  </button>

                  {/* Botão Gerar por IA */}
                  {photoUrl && onGenerateOfficePhoto && (
                    <>
                      <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider">OU</div>
                      <button
                        onClick={onGenerateOfficePhoto}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Gerando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="font-semibold">Gerar imagem por IA</span>
                          </>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                      </button>
                      <p className="text-[10px] text-center text-gray-400">
                        A IA criará uma imagem do consultório baseada na sua foto de perfil.
                      </p>
                    </>
                  )}
                </div>
              )}

              {aboutCameraError && (
                <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg border border-red-100">
                  {aboutCameraError}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Preview & Enhance */}
          <div className="flex flex-col items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Pré-visualização</h3>
             
             {photoUrl ? (
               <div className="space-y-4 w-full">
                 <div className="relative group w-full aspect-[3/4] max-w-[200px] mx-auto">
                   <img 
                     src={photoUrl} 
                     alt="Profile Preview" 
                     className="w-full h-full object-cover rounded-lg shadow-md border-4 border-white"
                   />
                   {isEnhanced && (
                     <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                       Perfil IA
                     </div>
                   )}
                   <button 
                     onClick={() => {
                       onPhotoChange('');
                       if (fileInputRef.current) {
                         fileInputRef.current.value = '';
                       }
                     }}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                     title="Remover foto"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>

                 {/* Foto de Consultório Preview */}
                 {aboutPhotoUrl && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 text-center font-medium">Foto do Consultório</p>
                      <div className="relative group w-full aspect-[3/4] max-w-[200px] mx-auto">
                        <img 
                          src={aboutPhotoUrl} 
                          alt="Consultório Médico" 
                          className="w-full h-full object-cover rounded-lg shadow-md border-4 border-white"
                        />
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                          {isEnhanced ? 'Consultório IA' : 'Consultório'}
                        </div>
                        {onAboutPhotoChange && (
                          <button 
                            onClick={() => {
                              if (onAboutPhotoChange) {
                                onAboutPhotoChange('');
                              }
                              if (aboutFileInputRef.current) {
                                aboutFileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remover foto"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                 )}
               </div>
             ) : (
               <div className="w-full aspect-[3/4] max-w-[240px] bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2">
                 <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="text-sm">Aguardando foto...</span>
               </div>
             )}
             
             {photoUrl && !isEnhanced && (
               <div className="mt-6 w-full max-w-[240px]">
                 <button
                   onClick={() => onEnhance(photoUrl)}
                   disabled={isLoading}
                   className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                 >
                   {isLoading ? (
                     <>
                       <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Processando...
                     </>
                   ) : (
                     <>
                       <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       <span className="font-semibold">Melhorar com IA</span>
                     </>
                   )}
                   <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                 </button>
                 <p className="text-[10px] text-center text-gray-400 mt-2">
                   O "Nano Banana Studio" ajustará iluminação e criará a versão de Consultório.
                 </p>
               </div>
             )}
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onNext}
            disabled={!photoUrl || isLoading}
            className={`px-8 py-2.5 rounded-lg font-bold text-white transition-all shadow-md transform hover:-translate-y-0.5 ${
              photoUrl && !isLoading ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Gerar Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};