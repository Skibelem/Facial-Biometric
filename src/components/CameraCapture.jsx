import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * CameraCapture Component
 * Renders HTML5 video element, canvas detection overlay, status indicators, and capture controls.
 */
export default function CameraCapture({
  videoRef,
  isStreaming,
  cameraError,
  onStartCamera,
  onStopCamera,
  onCapture,
  detectionStatus = null, // { faceDetected: boolean, count: number, label: string }
  isProcessing = false,
  captureButtonText = 'Capture Image',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Clear canvas overlay when camera stops
    if (!isStreaming && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [isStreaming]);

  return (
    <div className="space-y-4">
      {/* Video Viewport Container */}
      <div className="relative aspect-video max-w-lg mx-auto rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isStreaming ? 'block' : 'hidden'
          }`}
        />

        {/* Detection Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
        />

        {/* Offline / Placeholder View */}
        {!isStreaming && (
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <CameraOff className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">Camera Feed Inactive</p>
              <p className="text-xs text-slate-500">Click below to grant permission and activate webcam</p>
            </div>
          </div>
        )}

        {/* Real-time Status Overlay Badge */}
        {isStreaming && detectionStatus && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono backdrop-blur-md border ${
                detectionStatus.faceDetected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {detectionStatus.faceDetected ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              {detectionStatus.label || (detectionStatus.faceDetected ? 'Face Detected' : 'Position Face in Center')}
            </span>
          </div>
        )}
      </div>

      {/* Camera Permission / Access Error Alert */}
      {cameraError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs max-w-lg mx-auto">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isStreaming ? (
          <button
            type="button"
            onClick={onStartCamera}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Activate Camera
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCapture}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {captureButtonText}
            </button>
            <button
              type="button"
              onClick={onStopCamera}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm border border-slate-700 transition-all cursor-pointer"
            >
              Stop Camera
            </button>
          </>
        )}
      </div>
    </div>
  );
}
