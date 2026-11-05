import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = '@pending_registration_draft';
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Save or overwrite the registration draft
 * @param {Object} draftData
 */
export const saveRegistrationDraft = async (draftData) => {
  try {
    const payload = {
      ...draftData,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to save registration draft:', error);
  }
};

/**
 * Update existing draft by merging new fields
 * @param {Object} partialData
 */
export const updateRegistrationDraft = async (partialData) => {
  try {
    const existing = await getRegistrationDraft();
    const merged = {
      ...(existing || {}),
      ...partialData,
      userData: {
        ...(existing?.userData || {}),
        ...(partialData?.userData || {}),
      },
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to update registration draft:', error);
  }
};

/**
 * Get active registration draft if not expired
 */
export const getRegistrationDraft = async () => {
  try {
    const data = await AsyncStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (!parsed || !parsed.updatedAt) return null;

    // Discard drafts older than 48 hours
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      await clearRegistrationDraft();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to get registration draft:', error);
    return null;
  }
};

/**
 * Clear the registration draft
 */
export const clearRegistrationDraft = async () => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear registration draft:', error);
  }
};

export default {
  saveRegistrationDraft,
  updateRegistrationDraft,
  getRegistrationDraft,
  clearRegistrationDraft,
};

