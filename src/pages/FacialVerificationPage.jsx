import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCamera } from '../hooks/useCamera';
import CameraCapture from '../components/CameraCapture';
import { loadFaceApiModels, faceapi } from '../utils/faceApiLoader';
import { getFacialTemplate, verifyFacialMatch } from '../services/biometricService';
import { createAuthLog } from '../services/logService';
import { KeyRound, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Loader2, Sparkles, ArrowRight, Settings } from 'lucide-react';

/**
 * FacialVerificationPage Component
 * Performs secondary facial biometric verification after email + password login.
 * Compares live 128D feature descriptor against stored template with a configurable matching threshold.
 */
export default function FacialVerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { videoRef, isStreaming, cameraError, startCamera, stopCamera } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState('');
  const [storedTemplate, setStoredTemplate] = useState(null);
  const [hasEnrolled, setHasEnrolled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Configurable match threshold (default 0.6)
  const [threshold, setThreshold] = useState(0.6);
  const [verificationResult, setVerificationResult] = useState(null); // { isMatch, distance, threshold }

  // Load models and fetch user's stored facial template on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadFaceApiModels();
        if (mounted) setModelsReady(true);

        if (user?.id) {
          const { record, error } = await getFacialTemplate(user.id);
          if (mounted) {
            if (error || !record || !record.facial_template) {
              setHasEnrolled(false);
            } else {
              setStoredTemplate(record.facial_template);
              setHasEnrolled(true);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('[FacialVerificationPage] Init error:', err);
          setModelLoadingError('Failed to load facial recognition models.');
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleVerifyFacialMatch = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setVerificationResult(null);

    if (!isStreaming || !videoRef.current) {
      setErrorMessage('Camera is not active. Please click Activate Camera first.');
      return;
    }

    if (!storedTemplate) {
      setErrorMessage('No facial enrolment record found for your account. Please complete enrolment first.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Extracting live facial features & computing similarity distance...');

    try {
      const videoEl = videoRef.current;

      // 1. Detect live face & extract 128D descriptor
      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setErrorMessage('No face detected in video frame. Please position your face clearly in the center.');
        // Log attempt as FACE_NOT_DETECTED
        await createAuthLog({ userId: user.id, status: 'FACE_NOT_DETECTED' });
        setIsProcessing(false);
        return;
      }

      // Convert Float32Array descriptor to standard array
      const liveDescriptor = Array.from(detection.descriptor);

      // 2. Compare live descriptor with stored template string using configurable threshold
      const matchResult = verifyFacialMatch(liveDescriptor, storedTemplate, threshold);
      setVerificationResult(matchResult);

      // 3. Record audit log entry in authentication_log table
      const logStatus = matchResult.isMatch ? 'SUCCESS' : 'FAILED_VERIFICATION';
      await createAuthLog({
        userId: user.id,
        status: logStatus,
      });

      stopCamera();

      if (matchResult.isMatch) {
        setStatusMessage('Facial verification successful! Access Granted.');
      } else {
        setErrorMessage(`Facial verification failed. Match score (${matchResult.distance}) exceeded threshold (${matchResult.threshold}).`);
      }
    } catch (err) {
      console.error('[FacialVerificationPage] Verification error:', err);
      setErrorMessage(err.message || 'An error occurred during facial verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Facial Verification</h1>
            <p className="text-xs text-slate-500">
              Secondary biometric authentication layer after user login
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-mono text-cyan-700 flex items-center gap-1.5 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Verification Active
        </span>
      </div>

      {/* Model & Enrolment Checks */}
      {!modelsReady && !modelLoadingError && (
        <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center gap-3 text-cyan-800 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-600" />
          <span>Initializing facial verification module...</span>
        </div>
      )}

      {!hasEnrolled && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Facial Enrolment Required
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            You have not completed facial enrolment yet. Please complete enrolment first to enable secondary facial verification.
          </p>
          <button
            onClick={() => navigate('/enrolment')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
          >
            Go to Facial Enrolment
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Configurable Threshold Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs text-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-600" />
          <span>Configurable Match Threshold:</span>
          <span className="font-mono text-cyan-600 font-bold">{threshold}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.3"
            max="0.8"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="accent-cyan-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Verification Notice</div>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {statusMessage && !errorMessage && (
        <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center gap-3 text-cyan-800 text-xs font-mono">
          <Loader2 className={`w-4 h-4 text-cyan-600 ${isProcessing ? 'animate-spin' : 'hidden'}`} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Verification Viewport */}
      {hasEnrolled && !verificationResult?.isMatch && (
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
          <div className="text-xs text-slate-600 border-b border-slate-100 pb-3">
            <p className="font-semibold text-slate-800 mb-1">Facial Verification Instructions:</p>
            <p>Position your face in the camera viewport and click Verify Identity.</p>
          </div>

          <CameraCapture
            videoRef={videoRef}
            isStreaming={isStreaming}
            cameraError={cameraError}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onCapture={handleVerifyFacialMatch}
            isProcessing={isProcessing}
            captureButtonText="Verify Identity"
          />
        </div>
      )}

      {/* Success Access Granted Result */}
      {verificationResult?.isMatch && (
        <div className="p-8 rounded-2xl bg-white border border-emerald-200 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Access Granted</h2>
            <p className="text-xs text-slate-600">
              Facial verification successful. Match score ({verificationResult.distance}) satisfies threshold ({verificationResult.threshold}).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left text-xs font-mono space-y-1 text-slate-700">
            <div className="text-cyan-700 font-semibold mb-1">VERIFICATION AUDIT LOG</div>
            <div>Status: <span className="text-emerald-600 font-bold">SUCCESS</span></div>
            <div>Euclidean Distance: {verificationResult.distance}</div>
            <div>Configured Threshold: {verificationResult.threshold}</div>
            <div>Timestamp: {new Date().toLocaleTimeString()}</div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-cyan-600/20"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
