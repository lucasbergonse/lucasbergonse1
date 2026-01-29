
import { useRef, useCallback, useEffect, useState } from 'react';
import { CONFIG } from '../utils/constants.ts';
import { ScreenSource } from '../types.ts';

// Hook aprimorado para lidar com Electron e Navegador
export const useScreen = (sendInput: (data: any) => void) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // Novos estados para o seletor do Electron
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const screenStreamRef = useRef<MediaStream | null>(null);
  const previousFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const stopScreenSharing = useCallback((options?: { keepError: boolean }) => {
    setIsScreenSharing(false);
    setIsRequestingPermission(false);
    setIsSourcePickerOpen(false);
    if (!options?.keepError) {
      setErrorMessage(null);
    }
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    screenStreamRef.current = null;
    setScreenStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    previousFrameDataRef.current = null;
  }, []);

  const startScreenSharing = useCallback(async (sourceId?: string) => {
    setIsSourcePickerOpen(false);
    setIsRequestingPermission(true);
    setErrorMessage(null);
    
    try {
      let stream;
      if (sourceId && window.electronAPI) {
        // Modo Electron: Captura a fonte específica
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              // @ts-ignore
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
              },
            },
        });
      } else {
        // Modo Navegador: Usa o seletor padrão
        stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
                // @ts-ignore
                cursor: "always", 
                width: { ideal: 1920, max: 3840 }, 
                height: { ideal: 1080, max: 2160 },
                frameRate: { ideal: CONFIG.FRAME_RATE }
            }, 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
      }
        
      screenStreamRef.current = stream;
      setScreenStream(stream); 
      
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => stopScreenSharing();
      setIsScreenSharing(true);
    } catch (e: any) {
        console.error("Screen Share Error:", e);
        if (e.name === 'NotAllowedError') {
          setErrorMessage('Permissão negada. Verifique as configurações de privacidade do seu navegador ou sistema operacional.');
        } else {
          setErrorMessage('Falha ao iniciar o compartilhamento de tela.');
        }
        stopScreenSharing({ keepError: true });
    } finally {
        setIsRequestingPermission(false);
    }
  }, [stopScreenSharing]);
  
  // Nova função para iniciar o processo, detectando o ambiente
  const initiateScreenSharing = useCallback(async () => {
    setErrorMessage(null);
    if (window.electronAPI) {
      // Estamos no Electron, buscar fontes
      setIsRequestingPermission(true);
      try {
        const sources = await window.electronAPI.getScreenSources();
        // Converte thumbnail para URL de dados
        const sourcesWithDataUrl = sources.map(s => ({...s, thumbnailURL: (s as any).thumbnail.toDataURL()}));
        setScreenSources(sourcesWithDataUrl);
        setIsSourcePickerOpen(true);
      } catch (e) {
        console.error("Failed to get screen sources:", e);
        setErrorMessage('Não foi possível obter as fontes de tela.');
      } finally {
        setIsRequestingPermission(false);
      }
    } else {
      // Estamos no navegador, usar o fluxo padrão
      startScreenSharing();
    }
  }, [startScreenSharing]);

  const clearScreenError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (isScreenSharing) {
        const PROCESSING_FPS = 10; 
        
        intervalId = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState >= 2) {
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                
                let targetW = vw;
                let targetH = vh;
                
                if (vw > CONFIG.VISUAL_MAX_DIMENSION || vh > CONFIG.VISUAL_MAX_DIMENSION) {
                     const ratio = vw / vh;
                     if (ratio > 1) {
                         targetW = CONFIG.VISUAL_MAX_DIMENSION;
                         targetH = targetW / ratio;
                     } else {
                         targetH = CONFIG.VISUAL_MAX_DIMENSION;
                         targetW = targetH * ratio;
                     }
                }

                if (canvas.width !== targetW || canvas.height !== targetH) {
                    canvas.width = targetW;
                    canvas.height = targetH;
                    previousFrameDataRef.current = null;
                }

                const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, targetW, targetH);
                    const imageData = ctx.getImageData(0, 0, targetW, targetH);
                    const currentData = imageData.data;
                    const now = Date.now();

                    let hasChange = false;
                    
                    if (!previousFrameDataRef.current) {
                        hasChange = true;
                    } else if (now - lastFrameTimeRef.current > 3000) {
                        hasChange = true; 
                    } else {
                        let diffCount = 0;
                        const threshold = 15;
                        const totalPixels = currentData.length;
                        const sampleStep = 32;
                        
                        for (let i = 0; i < totalPixels; i += sampleStep) {
                            if (Math.abs(currentData[i] - previousFrameDataRef.current[i]) > threshold) {
                                diffCount++;
                            }
                        }
                        
                        if (diffCount > (totalPixels / sampleStep) * 0.01) {
                            hasChange = true;
                        }
                    }

                    if (hasChange) {
                        const base64 = canvas.toDataURL('image/jpeg', CONFIG.JPEG_QUALITY).split(',')[1];
                        sendInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                        previousFrameDataRef.current = new Uint8ClampedArray(currentData);
                        lastFrameTimeRef.current = now;
                    }
                }
            }
        }, 1000 / PROCESSING_FPS);
    }
    return () => clearInterval(intervalId);
  }, [isScreenSharing, sendInput]);

  return { 
    isScreenSharing, 
    isRequestingPermission, 
    screenStream,
    isSourcePickerOpen,
    screenSources,
    errorMessage,
    initiateScreenSharing, // Exportar a nova função de início
    startScreenSharing,     // Manter para ser usada após seleção
    stopScreenSharing, 
    clearScreenError,
    videoRef, 
    canvasRef 
  };
};