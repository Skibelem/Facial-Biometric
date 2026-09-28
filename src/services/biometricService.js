import { supabase } from '../config/supabase';

const FACIAL_CAPTURES_BUCKET = 'facial-captures';

/**
 * Biometric Service Module
 * Integration of existing pre-trained facial recognition models and Supabase storage.
 */

/**
 * Save or update a user's facial biometric template (TEXT representation) in PostgreSQL.
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {string} params.facialTemplate - Extracted 128D facial feature vector formatted as TEXT
 * @returns {Promise<{ record: object, error: object }>}
 */
export const saveFacialTemplate = async ({ userId, facialTemplate }) => {
  if (typeof facialTemplate !== 'string') {
    return {
      record: null,
      error: new Error('facialTemplate must be provided in TEXT format.'),
    };
  }

  const { data, error } = await supabase
    .from('facial_biometric')
    .upsert(
      {
        user_id: userId,
        facial_template: facialTemplate,
        capture_date: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[biometricService.saveFacialTemplate] Error:', error.message);
    return { record: null, error };
  }

  return { record: data, error: null };
};

/**
 * Retrieve a user's stored facial biometric record from PostgreSQL.
 * @param {string} userId - User UUID
 * @returns {Promise<{ record: object, error: object }>}
 */
export const getFacialTemplate = async (userId) => {
  const { data, error } = await supabase
    .from('facial_biometric')
    .select('biometric_id, user_id, facial_template, capture_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[biometricService.getFacialTemplate] Error:', error.message);
    return { record: null, error };
  }

  return { record: data, error: null };
};

/**
 * Fetch all enrolled facial templates for 1:N matching.
 * [DEBUG ENABLED] Logs query response and row counts.
 * @returns {Promise<{ templates: Array, error: object }>}
 */
export const getAllFacialTemplates = async () => {
  console.log('[DEBUG 1] Executing getAllFacialTemplates DB query...');

  const { data, error } = await supabase
    .from('facial_biometric')
    .select('biometric_id, user_id, facial_template, capture_date');

  console.log('[DEBUG 1 RESULT] getAllFacialTemplates:', {
    templateCount: data ? data.length : 0,
    error: error ? error.message : null,
    dataPreview: data ? data.map(d => ({ userId: d.user_id, hasTemplate: Boolean(d.facial_template) })) : [],
  });

  if (error) {
    console.error('[biometricService.getAllFacialTemplates] Query error:', error.message);
    return { templates: [], error };
  }

  return { templates: data || [], error: null };
};

/**
 * Secure Server-Side 1:N Facial Biometric Authentication via PostgreSQL RPC Function.
 * [DEBUG ENABLED] Logs RPC response and fallback triggers.
 * @param {string} liveDescriptorString - JSON string of 128D live facial vector
 * @param {number} [threshold=0.6] - Configurable distance threshold (default 0.6)
 * @returns {Promise<{ result: object, error: object }>}
 */
export const verifyBiometricLoginServerSide = async (liveDescriptorString, threshold = 0.6) => {
  console.log('[DEBUG 2] Calling RPC verify_biometric_login with threshold:', threshold);
  try {
    const { data, error } = await supabase.rpc('verify_biometric_login', {
      p_live_descriptor: liveDescriptorString,
      p_threshold: threshold,
    });

    console.log('[DEBUG 2 RESULT] RPC verify_biometric_login returned:', { data, error });

    if (error) {
      console.warn('[DEBUG 2 FALLBACK] RPC failed, triggering findMatchingUserLocal fallback. Reason:', error.message);
      return await findMatchingUserLocal(JSON.parse(liveDescriptorString), threshold);
    }

    return { result: data, error: null };
  } catch (err) {
    console.error('[DEBUG 2 EXCEPTION] RPC execution exception:', err);
    console.warn('[DEBUG 2 FALLBACK] Triggering findMatchingUserLocal fallback after exception.');
    return await findMatchingUserLocal(JSON.parse(liveDescriptorString), threshold);
  }
};

/**
 * Compares a live 128D descriptor against a stored descriptor string.
 * Calculates Euclidean distance between the two vectors.
 * @param {Array|Float32Array} liveDescriptor - Live extracted 128D feature array
 * @param {string} storedTemplateString - Stored JSON string of 128D feature array
 * @param {number} [threshold=0.6] - Configurable match threshold (default 0.6)
 * @returns {{ isMatch: boolean, distance: number, threshold: number }}
 */
export const verifyFacialMatch = (liveDescriptor, storedTemplateString, threshold = 0.6) => {
  try {
    if (!liveDescriptor || !storedTemplateString) {
      return { isMatch: false, distance: 1.0, threshold };
    }

    const storedDescriptor = typeof storedTemplateString === 'string'
      ? JSON.parse(storedTemplateString)
      : storedTemplateString;

    let sum = 0;
    for (let i = 0; i < Math.min(liveDescriptor.length, storedDescriptor.length); i++) {
      const diff = liveDescriptor[i] - storedDescriptor[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    return {
      isMatch: distance <= threshold,
      distance: Number(distance.toFixed(4)),
      threshold,
    };
  } catch (err) {
    console.error('[biometricService.verifyFacialMatch] Error:', err);
    return { isMatch: false, distance: 1.0, threshold };
  }
};

/**
 * Local 1:N Facial Biometric Identification fallback logic.
 * [DEBUG ENABLED] Logs template iterations and distance calculations.
 * @param {Array|Float32Array} liveDescriptor - Live 128D vector
 * @param {number} [threshold=0.6] - Configurable threshold
 * @returns {Promise<{ result: object, error: object }>}
 */
export const findMatchingUserLocal = async (liveDescriptor, threshold = 0.6) => {
  console.log('[DEBUG 3] Starting findMatchingUserLocal matching process...');
  console.log('[DEBUG 3 INPUT] Live descriptor element count:', liveDescriptor ? liveDescriptor.length : 0);

  const { templates, error } = await getAllFacialTemplates();

  console.log('[DEBUG 3 TEMPLATES] Retrieved template count:', templates ? templates.length : 0);

  if (error || !templates || templates.length === 0) {
    console.warn('[DEBUG 3 FAILURE] Cannot perform matching: templates list is empty or returned error.');
    return {
      result: {
        matched: false,
        distance: 1.0,
        threshold,
        message: 'No enrolled biometric records found in database (0 templates retrieved).',
      },
      error,
    };
  }

  let minDistance = 999;
  let matchedUser = null;

  for (let idx = 0; idx < templates.length; idx++) {
    const record = templates[idx];
    try {
      const storedVec = typeof record.facial_template === 'string'
        ? JSON.parse(record.facial_template)
        : record.facial_template;

      console.log(`[DEBUG 3 RECORD ${idx + 1}] Evaluating user ${record.user_id}, vector length: ${storedVec ? storedVec.length : 0}`);

      let sum = 0;
      for (let i = 0; i < Math.min(liveDescriptor.length, storedVec.length); i++) {
        const diff = liveDescriptor[i] - storedVec[i];
        sum += diff * diff;
      }
      const dist = Math.sqrt(sum);

      console.log(`[DEBUG 3 DISTANCE ${idx + 1}] Computed Euclidean Distance: ${dist.toFixed(4)} (Threshold: ${threshold})`);

      if (dist < minDistance) {
        minDistance = dist;
        if (dist <= threshold) {
          matchedUser = {
            user_id: record.user_id,
            full_name: record.users?.full_name || 'Enrolled User',
            email: record.users?.email || '',
          };
          console.log(`[DEBUG 3 MATCH FOUND] Candidate matched user ${matchedUser.user_id} with distance ${dist.toFixed(4)}`);
        }
      }
    } catch (err) {
      console.error(`[DEBUG 3 RECORD ERROR ${idx + 1}] Failed to parse/compare record:`, err);
    }
  }

  if (matchedUser) {
    console.log('[DEBUG 3 FINAL SUCCESS] Matching user identified:', matchedUser);
    return {
      result: {
        matched: true,
        user_id: matchedUser.user_id,
        full_name: matchedUser.full_name,
        email: matchedUser.email,
        distance: Number(minDistance.toFixed(4)),
        threshold,
      },
      error: null,
    };
  }

  console.warn(`[DEBUG 3 FINAL NO MATCH] Lowest distance was ${minDistance.toFixed(4)} which exceeds threshold ${threshold}`);

  return {
    result: {
      matched: false,
      distance: Number((minDistance === 999 ? 1.0 : minDistance).toFixed(4)),
      threshold,
      message: 'No matching facial biometric profile found.',
    },
    error: null,
  };
};

/**
 * Upload a captured raw facial image to the private 'facial-captures' Supabase Storage bucket.
 * @param {object} params
 * @param {string} params.userId - User UUID
 * @param {Blob|File} params.imageBlob - Captured image file/blob
 * @returns {Promise<{ path: string, error: object }>}
 */
export const uploadFacialCaptureImage = async ({ userId, imageBlob }) => {
  const fileName = `${userId}/capture_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from(FACIAL_CAPTURES_BUCKET)
    .upload(fileName, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('[biometricService.uploadFacialCaptureImage] Error:', error.message);
    return { path: null, error };
  }

  return { path: data.path, error: null };
};

/**
 * Get a temporary signed download URL for a private facial capture image.
 * @param {string} imagePath - Storage object path (e.g., 'userId/capture_123.jpg')
 * @param {number} [expiresInSeconds=300] - Expiration duration in seconds
 * @returns {Promise<{ signedUrl: string, error: object }>}
 */
export const getFacialCaptureImageUrl = async (imagePath, expiresInSeconds = 300) => {
  const { data, error } = await supabase.storage
    .from(FACIAL_CAPTURES_BUCKET)
    .createSignedUrl(imagePath, expiresInSeconds);

  if (error) {
    console.error('[biometricService.getFacialCaptureImageUrl] Error:', error.message);
    return { signedUrl: null, error };
  }

  return { signedUrl: data.signedUrl, error: null };
};
