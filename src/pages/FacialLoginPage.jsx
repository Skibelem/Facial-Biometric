import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCamera } from '../hooks/useCamera';
import CameraCapture from '../components/CameraCapture';
import { loadFaceApiModels, faceapi } from '../utils/faceApiLoader';
import { verifyBiometricLoginServerSide } from '../services/biometricService';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Camera,
  Settings,
  Lock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const VERIFICATION_STAGES = [
  { id: 'prepare', label: 'Preparing Authentication' },
  { id: 'camera', label: 'Activating Camera' },
  { id: 'capture', label: 'Capturing Face' },
  { id: 'extract', label: 'Extracting Facial Features' },
  { id: 'verify', label: 'Verifying Identity' },
  { id: 'session', label: 'Creating Secure Session' },
];

/**
 * FacialLoginPage Component
 * Direct Facial Biometric Authentication Login (/facial-login).
 * Performs 1:N facial matching to identify returning users and establish an authenticated session.
 * Features real-time progress tracking modal, explicit success confirmation modal, and failure recovery.
 */
export default function FacialLoginPage() {
  const { authenticateBiometricUser, session } = useAuth();
  const navigate = useNavigate();
  const { videoRef, isStreaming, cameraError, startCamera, stopCamera } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [threshold, setThreshold] = useState(0.6);
  const [loginSuccessResult, setLoginSuccessResult] = useState(null);

  // UX Modal state: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  const [modalState, setModalState] = useState('IDLE');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [userConfirmedSuccess, setUserConfirmedSuccess] = useState(false);

  // Auto-redirect ONLY if user had an existing session before visiting /facial-login
  useEffect(() => {
    if (session && modalState !== 'SUCCESS' && modalState !== 'PROCESSING' && !userConfirmedSuccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, modalState, userConfirmedSuccess, navigate]);

  // Load face-api.js models on mount
  useEffect(() => {
    let mounted = true;
    console.log('[FacialLoginPage] Component mounted. Initializing face-api.js models...');
    loadFaceApiModels()
      .then(() => {
        if (mounted) {
          console.log('[FacialLoginPage] face-api.js models ready.');
          setModelsReady(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('[FacialLoginPage] Model load error:', err);
          setModelLoadingError('Failed to initialize facial recognition security models.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleFacialBiometricLogin = async () => {
    if (isProcessing) return; // Prevent multiple clicks

    setErrorMessage('');
    setIsProcessing(true);
    setModalState('PROCESSING');
    setCurrentStageIndex(0); // Stage 0: Preparing Authentication
    setLoginSuccessResult(null);

    // Timeout safety guard (25 seconds)
    const timeoutId = setTimeout(() => {
      setModalState('TIMEOUT');
      setErrorMessage('Verification request timed out. The operation took longer than expected. Please check your camera feed and try again.');
      setIsProcessing(false);
    }, 25000);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Stage 0 -> Stage 1: Activating Camera
      await delay(350);
      setCurrentStageIndex(1);

      if (!isStreaming || !videoRef.current) {
        console.log('[FacialLoginPage] Activating camera feed...');
        const camOk = await startCamera();
        if (!camOk && !videoRef.current) {
          throw new Error('Camera stream could not be activated. Please ensure camera permission is granted.');
        }
        await delay(500);
      }

      if (!modelsReady) {
        throw new Error('Facial recognition security models are still loading. Please wait a moment.');
      }

      // Stage 1 -> Stage 2: Capturing Face
      setCurrentStageIndex(2);
      await delay(450);

      const videoEl = videoRef.current;
      if (!videoEl || videoEl.readyState < 2) {
        throw new Error('Camera video stream is not ready. Position your face in center and try again.');
      }

      // Stage 2 -> Stage 3: Extracting Facial Features
      setCurrentStageIndex(3);
      console.log('[FacialLoginPage] Running faceapi.detectSingleFace...');

      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('No face detected in video frame. Position your face clearly in the center with adequate lighting.');
      }

      console.log('[FacialLoginPage] Face features extracted successfully. Descriptor length:', detection.descriptor.length);

      const descriptorArray = Array.from(detection.descriptor);
      const liveDescriptorString = JSON.stringify(descriptorArray);

      // Stage 3 -> Stage 4: Verifying Identity
      setCurrentStageIndex(4);
      console.log('[FacialLoginPage] Verifying live face descriptor against enrolled database templates...');

      const { result, error } = await verifyBiometricLoginServerSide(liveDescriptorString, threshold);

      if (error || !result) {
        throw new Error(error?.message || 'Failed to connect to biometric matching service.');
      }

      if (!result.matched) {
        throw new Error(
          `No matching biometric profile found in database (Min Distance: ${result.distance}, Threshold: ${result.threshold}). ${result.message || ''}`
        );
      }

      // Stage 4 -> Stage 5: Creating Secure Session
      setCurrentStageIndex(5);
      console.log('[FacialLoginPage] Biometric identity matched! Creating session for:', result.full_name);

      stopCamera();
      setLoginSuccessResult(result);

      if (typeof authenticateBiometricUser === 'function') {
        const authRes = await authenticateBiometricUser({
          userId: result.user_id,
          email: result.email,
          fullName: result.full_name,
        });

        if (!authRes?.success) {
          throw new Error(authRes?.error || 'Failed to establish persistent user session.');
        }
      }

      // Complete all stages successfully!
      clearTimeout(timeoutId);
      await delay(450);
      setModalState('SUCCESS');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[FacialLoginPage] Verification failure:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during facial biometric login.');
      setModalState('FAILED');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessOK = () => {
    setUserConfirmedSuccess(true);
    navigate('/dashboard', { replace: true });
  };

  const handleTryAgain = () => {
    setModalState('IDLE');
    setErrorMessage('');
    setCurrentStageIndex(0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Facial Biometric Login</h1>
            <p className="text-xs text-slate-500">
              Facial Biometric Identity Verification
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-cyan-600" />
          Password Login
        </Link>
      </div>

      {/* Model Loader Warning */}
      {!modelsReady && !modelLoadingError && (
        <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center gap-3 text-cyan-800 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-600" />
          <span>Initializing facial recognition security module...</span>
        </div>
      )}

      {modelLoadingError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{modelLoadingError}</span>
        </div>
      )}

      {/* Threshold Controller Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs text-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-600" />
          <span>Match Threshold Sensitivity:</span>
          <span className="font-mono text-cyan-600 font-bold">{threshold}</span>
        </div>
        <input
          type="range"
          min="0.3"
          max="0.8"
          step="0.05"
          value={threshold}
          disabled={isProcessing}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="accent-cyan-600 cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* Main Facial Login Interface */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-xs text-slate-600 space-y-1 border-b border-slate-100 pb-3">
          <p className="font-semibold text-slate-800">Facial Authentication Instructions:</p>
          <p>Position your face in the camera viewport and click Authenticate with Face.</p>
        </div>

        <CameraCapture
          videoRef={videoRef}
          isStreaming={isStreaming}
          cameraError={cameraError}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onCapture={handleFacialBiometricLogin}
          isProcessing={isProcessing}
          captureButtonText={isProcessing ? 'Verifying Identity...' : 'Authenticate with Face'}
        />
      </div>

      {/* VERIFICATION PROGRESS & FEEDBACK MODAL DIALOG */}
      {modalState !== 'IDLE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
            
            {/* 1. PROCESSING PROGRESS STATE */}
            {modalState === 'PROCESSING' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-600/20 relative">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Authenticating Biometric Identity</h3>
                  <p className="text-xs text-slate-500">Please remain centered while verification steps complete.</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(Math.round(((currentStageIndex + 1) / VERIFICATION_STAGES.length) * 100), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-medium">
                    <span>Verification Progress</span>
                    <span>{Math.min(Math.round(((currentStageIndex + 1) / VERIFICATION_STAGES.length) * 100), 100)}%</span>
                  </div>
                </div>

                {/* Dynamic Stages List */}
                <div className="space-y-2 text-left pt-2">
                  {VERIFICATION_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isPending = idx > currentStageIndex;

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-center justify-between p-3 rounded-xl text-xs transition-all border ${
                          isCompleted
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium'
                            : isCurrent
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold ring-2 ring-cyan-400/20 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isCurrent && <Loader2 className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />}
                          {isPending && <Circle className="w-4 h-4 text-slate-300 shrink-0" />}
                          <span>{stage.label}</span>
                        </div>

                        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                          {isCompleted && <span className="text-emerald-600">Completed</span>}
                          {isCurrent && <span className="text-cyan-600">Processing</span>}
                          {isPending && <span className="text-slate-400">Pending</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 2. SUCCESS CONFIRMATION MODAL STATE */}
            {modalState === 'SUCCESS' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">Identity Verified</h3>
                  <p className="text-lg font-semibold text-cyan-600">
                    Welcome, {loginSuccessResult?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 pt-1">Authentication completed successfully.</p>
                </div>

                {/* Match metrics info */}
                {loginSuccessResult?.distance !== undefined && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
                    <div>Biometric Match: <span className="text-emerald-600 font-bold">CONFIRMED (1:N)</span></div>
                    <div>Euclidean Distance: <span className="font-bold text-slate-800">{loginSuccessResult.distance}</span> (Threshold: {loginSuccessResult.threshold})</div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSuccessOK}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  OK
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* 3. FAILURE / TIMEOUT ERROR MODAL STATE */}
            {(modalState === 'FAILED' || modalState === 'TIMEOUT') && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900">Verification Failed</h3>
                  <p className="text-xs text-slate-500">
                    {modalState === 'TIMEOUT' ? 'Authentication Request Timeout' : 'Biometric Security Check Unsuccessful'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-left text-xs text-red-700 space-y-1">
                  <div className="font-semibold text-red-800">Reason for failure:</div>
                  <p className="leading-relaxed">{errorMessage || 'No face detected or matching biometric profile was not found.'}</p>
                </div>

                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
