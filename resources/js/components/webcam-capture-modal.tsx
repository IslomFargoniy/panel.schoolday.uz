import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface WebcamCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCapture: (file: File) => void;
}

export default function WebcamCaptureModal({ open, onOpenChange, onCapture }: WebcamCaptureModalProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        stopCamera();
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraFacing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch {
            setError(t('camera_permission_denied', 'Kameraga ulanishda xatolik. Brauzerda kamera ruxsatini yoqing.'));
        }
    }, [cameraFacing, stopCamera, t]);

    useEffect(() => {
        let active = true;

        if (open && !capturedImage) {
            const init = async () => {
                stopCamera();
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: cameraFacing,
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        },
                        audio: false,
                    });

                    if (!active) {
                        mediaStream.getTracks().forEach((track) => track.stop());
                        return;
                    }

                    streamRef.current = mediaStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setError(null);
                } catch {
                    if (active) {
                        setError(t('camera_permission_denied', 'Kameraga ulanishda xatolik. Brauzerda kamera ruxsatini yoqing.'));
                    }
                }
            };
            init();
        } else {
            stopCamera();
        }

        return () => {
            active = false;
            stopCamera();
        };
    }, [open, capturedImage, cameraFacing, stopCamera, t]);

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 640;

        // Exact square crop centered to match the 1:1 square viewfinder
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Front camera mirroring to match live viewfinder
        if (cameraFacing === 'user') {
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const confirmPhoto = () => {
        if (!capturedImage) return;

        // Convert base64 dataUrl to File object
        fetch(capturedImage)
            .then((res) => res.blob())
            .then((blob) => {
                const file = new File([blob], `student_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onOpenChange(false);
                setCapturedImage(null);
            });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl bg-card p-5 shadow-2xl border border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Camera className="h-4 w-4" />
                        </div>
                        <span>{t('camera.modal_title', 'Kamera orqali rasmga olish')}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-3 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-2">
                    {error ? (
                        <div className="flex h-72 w-full flex-col items-center justify-center p-6 text-center text-rose-400">
                            <AlertCircle className="mb-2 h-10 w-10 text-rose-500" />
                            <p className="text-xs leading-relaxed">{error}</p>
                            <Button variant="outline" size="sm" onClick={startCamera} className="mt-4 text-xs">
                                {t('retry', 'Qayta urinish')}
                            </Button>
                        </div>
                    ) : capturedImage ? (
                        <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-xl bg-black flex items-center justify-center shadow-md">
                            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-xl bg-black flex items-center justify-center shadow-md">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`h-full w-full object-cover ${cameraFacing === 'user' ? 'transform -scale-x-100' : ''}`}
                            />
                            {/* Guide overlay */}
                            <div className="absolute inset-0 pointer-events-none rounded-xl flex flex-col items-center justify-between p-3">
                                <div className="h-44 w-36 rounded-[50%] border-2 border-dashed border-white/40 mt-3 flex items-center justify-center">
                                </div>
                                <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs">
                                    {t('camera.align_face', 'Yuzni markazga joylashtiring')}
                                </span>
                            </div>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <DialogFooter className="mt-4 flex flex-row items-center justify-between gap-2 border-t border-border pt-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => {
                            stopCamera();
                            setCapturedImage(null);
                            onOpenChange(false);
                        }}
                        className="text-xs"
                    >
                        {t('cancel', 'Bekor qilish')}
                    </Button>

                    <div className="flex gap-2">
                        {capturedImage ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={retake}
                                    className="flex items-center gap-1.5 text-xs text-foreground"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>{t('camera.retake', 'Qayta olish')}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={confirmPhoto}
                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>{t('camera.use_photo', 'Tanlash')}</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))}
                                    className="text-xs"
                                    title="Kamerani almashtirish"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={takePhoto}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-medium shadow-sm"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    <span>{t('camera.snap', 'Rasmga olish')}</span>
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
