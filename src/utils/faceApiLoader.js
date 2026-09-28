import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelLoadingPromise = null;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

/**
 * Utility to load pre-trained face-api.js neural network models.
 * Integration of existing pre-trained facial recognition models.
 * @returns {Promise<boolean>}
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return true;

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      console.log('[faceApiLoader] Loading pre-trained facial recognition models...');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      console.log('[faceApiLoader] Pre-trained models loaded successfully.');
      return true;
    } catch (err) {
      console.error('[faceApiLoader] Model loading failed:', err);
      modelsLoaded = false;
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

export { faceapi };
