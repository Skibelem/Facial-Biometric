import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCamera } from '../hooks/useCamera';
import CameraCapture from '../components/CameraCapture';
import { loadFaceApiModels, faceapi } from '../utils/faceApiLoader';
import { saveFacialTemplate, uploadFacialCaptureImage } from '../services/biometricService';
import { Camera, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';

/**
 * FacialEnrolmentPage Component
 * Enables authenticated users to capture facial biometric data using pre-trained models
 * and store the resulting 128D descriptor vector in PostgreSQL.
 */
export default function FacialEnrolmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { videoRef, isStreaming, cameraError, startCamera, stopCamera, captureCanvasBlob } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [enrolmentComplete, setEnrolmentComplete] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState(null);

  // Load pre-trained face-api.js models on mount
  useEffect(() => {
    let mounted = true;
    loadFaceApiModels()
      .then(() => {
        if (mounted) setModelsReady(true);
      })
      .catch((err) => {
        if (mounted) {
          console.error('[FacialEnrolmentPage] Model load error:', err);
          setModelLoadingError('Failed to load facial recognition models. Please check your network connection.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCaptureAndEnrol = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!isStreaming || !videoRef.current) {
      setErrorMessage('Camera is not active. Please click Activate Camera first.');
      return;
    }

    if (!modelsReady) {
      setErrorMessage('Facial recognition models are still initializing...');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Analyzing facial features with pre-trained models...');

    try {
      const videoEl = videoRef.current;

      // 1. Detect face and extract 128D descriptor vector
      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setDetectionStatus({ faceDetected: false, label: 'No Face Detected' });
        setErrorMessage('No face detected in video frame. Please position your face clearly in the center and ensure good lighting.');
        setIsProcessing(false);
        return;
      }

      setDetectionStatus({ faceDetected: true, label: 'Face Detected' });

      // Convert 128D Float32Array vector to JSON string format (TEXT)
      const descriptorArray = Array.from(detection.descriptor);
      const facialTemplateString = JSON.stringify(descriptorArray);

      setStatusMessage('Saving biometric template vector to database...');

      // 2. Save 128D vector template in public.facial_biometric
      const { error: dbError } = await saveFacialTemplate({
        userId: user.id,
        facialTemplate: facialTemplateString,
      });

      if (dbError) {
        setErrorMessage(`Database error: ${dbError.message}`);
        setIsProcessing(false);
        return;
      }

      setStatusMessage('Uploading captured facial photo to private storage...');

      // 3. Capture image blob and upload to private 'facial-captures' bucket
      const imageBlob = await captureCanvasBlob();
      if (imageBlob) {
        await uploadFacialCaptureImage({
          userId: user.id,
          imageBlob,
        });
      }

      stopCamera();
      setEnrolmentComplete(true);
      setStatusMessage('Facial enrolment completed successfully!');
    } catch (err) {
      console.error('[FacialEnrolmentPage] Enrolment error:', err);
      setErrorMessage(err.message || 'An error occurred during facial enrolment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Facial Enrolment</h1>
            <p className="text-xs text-slate-500">
              Secure biometric facial enrolment module
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-mono text-cyan-700 flex items-center gap-1.5 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Biometric Capture Active
        </span>
      </div>

      {/* Model Loading Status Indicator */}
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

      {/* Status Alert Banners */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Enrolment Notice</div>
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

      {/* Main Enrolment Interface */}
      {!enrolmentComplete ? (
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Instructions for Facial Enrolment:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Position your face clearly inside the center of the video frame.</li>
              <li>Ensure environment has adequate lighting with no heavy shadows.</li>
              <li>Click "Capture & Enrol Face" to generate your 128D facial template.</li>
            </ul>
          </div>

          <CameraCapture
            videoRef={videoRef}
            isStreaming={isStreaming}
            cameraError={cameraError}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onCapture={handleCaptureAndEnrol}
            detectionStatus={detectionStatus}
            isProcessing={isProcessing}
            captureButtonText="Capture & Enrol Face"
          />
        </div>
      ) : (
        /* Enrolment Completion Card */
        <div className="p-8 rounded-2xl bg-white border border-emerald-200 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Facial Enrolment Successful</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your 128D facial feature vector has been generated and stored in PostgreSQL, and your enrolment photo is stored in private storage.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-md shadow-cyan-600/20"
            >
              Return to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
