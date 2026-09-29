import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCamera } from '../hooks/useCamera';
import CameraCapture from '../components/CameraCapture';
import { loadFaceApiModels, faceapi } from '../utils/faceApiLoader';
import { verifyBiometricLoginServerSide } from '../services/biometricService';
import { KeyRound, ShieldCheck, AlertCircle, Loader2, Sparkles, ArrowRight, Camera, Settings, Lock } from 'lucide-react';

/**
 * FacialLoginPage Component
 * Direct Facial Biometric Authentication Login (/facial-login).
 * Performs 1:N facial matching to identify returning users and establish an authenticated session.
 * [DEBUG TRACING ENABLED]
 */
export default function FacialLoginPage() {
  const { authenticateBiometricUser, session } = useAuth();
  const navigate = useNavigate();
  const { videoRef, isStreaming, cameraError, startCamera, stopCamera } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [threshold, setThreshold] = useState(0.6);
  const [loginSuccess, setLoginSuccess] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  // Load face-api.js models on mount
  useEffect(() => {
    let mounted = true;
    console.log('[DEBUG PAGE] Component mounted. Initializing face-api.js models...');
    loadFaceApiModels()
      .then(() => {
        if (mounted) {
          console.log('[DEBUG PAGE] face-api.js models ready.');
          setModelsReady(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('[DEBUG PAGE] Model load error:', err);
          setModelLoadingError('Failed to initialize facial recognition models.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleFacialBiometricLogin = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setLoginSuccess(null);

    console.log('[DEBUG PAGE STEP 1] Triggered handleFacialBiometricLogin');

    if (!isStreaming || !videoRef.current) {
      console.warn('[DEBUG PAGE STEP 1] Camera is not streaming.');
      setErrorMessage('Camera is not active. Please click Activate Camera first.');
      return;
    }

    if (!modelsReady) {
      console.warn('[DEBUG PAGE STEP 1] Models are not ready yet.');
      setErrorMessage('Facial recognition models are still initializing...');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Capturing face & performing 1:N biometric identification...');

    try {
      const videoEl = videoRef.current;
      console.log('[DEBUG PAGE STEP 2] Running faceapi.detectSingleFace...');

      // 1. Detect live face & extract 128D descriptor vector
      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn('[DEBUG PAGE STEP 2 FAILURE] No face detected in video frame.');
        setErrorMessage('No face detected in video frame. Please center your face and ensure adequate lighting.');
        setIsProcessing(false);
        return;
      }

      console.log('[DEBUG PAGE STEP 2 SUCCESS] Face detected! Score:', detection.detection.score);
      console.log('[DEBUG PAGE STEP 2 SUCCESS] Descriptor length:', detection.descriptor.length);

      // Convert Float32Array descriptor to JSON string format (TEXT)
      const descriptorArray = Array.from(detection.descriptor);
      const liveDescriptorString = JSON.stringify(descriptorArray);

      setStatusMessage('Comparing live facial vector against enrolled database templates...');

      // 2. Perform 1:N facial biometric matching
      console.log('[DEBUG PAGE STEP 3] Executing verifyBiometricLoginServerSide...');
      const { result, error } = await verifyBiometricLoginServerSide(liveDescriptorString, threshold);

      console.log('[DEBUG PAGE STEP 3 RESULT] Match execution returned:', { result, error });

      if (error || !result) {
        console.error('[DEBUG PAGE STEP 3 ERROR] Biometric matching service error:', error);
        setErrorMessage('Failed to connect to biometric matching service.');
        setIsProcessing(false);
        return;
      }

      if (result.matched) {
        console.log('[DEBUG PAGE STEP 4 SUCCESS] Biometric identity matched!', result);
        stopCamera();
        setLoginSuccess(result);
        setStatusMessage(`Identity Verified: Welcome back, ${result.full_name}! Redirecting...`);

        // 3. Establish persistent biometric session
        if (typeof authenticateBiometricUser === 'function') {
          console.log('[DEBUG PAGE STEP 5] Hydrating AuthContext session with biometric identity...');
          const authRes = await authenticateBiometricUser({
            userId: result.user_id,
            email: result.email,
            fullName: result.full_name,
          });

          if (authRes?.success) {
            console.log('[DEBUG PAGE STEP 5 SUCCESS] Biometric session created. Navigating directly to /dashboard');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 600);
          } else {
            setErrorMessage('Failed to establish biometric session.');
          }
        } else {
          console.warn('[DEBUG PAGE STEP 5 WARN] authenticateBiometricUser function not available on AuthContext.');
        }
      } else {
        console.warn('[DEBUG PAGE STEP 4 FAILURE] Biometric match failed:', result);
        setErrorMessage(
          `Biometric login failed. No matching profile found (Min Distance: ${result.distance}, Threshold: ${result.threshold}). ${result.message || ''}`
        );
      }
    } catch (err) {
      console.error('[DEBUG PAGE EXCEPTION] Exception during biometric login:', err);
      setErrorMessage(err.message || 'An error occurred during facial biometric login.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="accent-cyan-600 cursor-pointer"
        />
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Authentication Notice</div>
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

      {/* Main Facial Login Interface */}
      {!loginSuccess ? (
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
            captureButtonText="Authenticate with Face"
          />
        </div>
      ) : (
        /* Login Success Card */
        <div className="p-8 rounded-2xl bg-white border border-emerald-200 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Identity Verified</h2>
            <p className="text-sm text-emerald-600 font-semibold">Welcome back, {loginSuccess.full_name}!</p>
            <p className="text-xs text-slate-500">
              Euclidean Distance: {loginSuccess.distance} (Threshold: {loginSuccess.threshold})
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-cyan-600/20"
          >
            Redirecting to Dashboard...
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
