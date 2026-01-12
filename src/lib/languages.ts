// Language utility functions and types
export const SUPPORTED_LANGUAGES = [
  'German',
  'English',
  'Spanish',
  'French',
  'Italian',
  'Portuguese',
  'Dutch',
  'Swedish',
  'Norwegian',
  'Danish',
  'Polish',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Hindi',
  'Bengali',
  'Bangla',
  'Arabic',
  'Turkish',
] as const;

export type Language = typeof SUPPORTED_LANGUAGES[number];

export interface UserLanguagePreferences {
  mainLanguage: Language;
  translationLanguages: Language[];
}

// Default preferences
export const DEFAULT_LANGUAGE_PREFERENCES: UserLanguagePreferences = {
  mainLanguage: 'German',
  translationLanguages: ['English', 'Bangla'],
};

/**
 * Get language labels for form fields based on user preferences
 */
export function getLanguageLabels(prefs: UserLanguagePreferences) {
  return {
    mainLanguage: prefs.mainLanguage,
    translation1: prefs.translationLanguages[0] || 'Language 1',
    translation2: prefs.translationLanguages[1] || 'Language 2',
  };
}

/**
 * Get column accessor keys for database
 */
export function getColumnAccessors() {
  return {
    mainWord: 'mainWord',
    translation1: 'translation1',
    translation2: 'translation2',
  };
}

/**
 * Get CSV export headers
 */
export function getExportHeaders(prefs: UserLanguagePreferences) {
  return {
    mainWord: prefs.mainLanguage,
    translation1: prefs.translationLanguages[0] || 'Language 1',
    translation2: prefs.translationLanguages[1] || 'Language 2',
    section: 'Section',
    exampleSentence: 'Sentence',
    notes: 'Notes',
  };
}

/**
 * Parse batch import words based on user language preferences
 */
export function parseBatchWords(
  text: string,
  pattern: string,
  section: string,
  prefs: UserLanguagePreferences
) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const words: any[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const parts = line.split('-');

    if (parts.length < 3 || parts.length > 4) {
      errors.push(
        `Line ${index + 1}: Invalid format.\n` +
        `Expected: "${prefs.mainLanguage}-${prefs.translationLanguages[0]}-${prefs.translationLanguages[1]}-[optional sentence]"\n` +
        `Got: "${line}"`
      );
      return;
    }

    // Validate that required parts are non-empty
    if (!parts[0].trim() || !parts[1].trim() || !parts[2].trim()) {
      errors.push(
        `Line ${index + 1}: ${prefs.mainLanguage}, ${prefs.translationLanguages[0]}, and ${prefs.translationLanguages[1]} are required.\n` +
        `Got: "${line}"`
      );
      return;
    }

    words.push({
      mainWord: parts[0].trim(),
      translation2: parts[1].trim(),
      translation1: parts[2].trim(),
      exampleSentence: parts[3]?.trim() || null,
      section: section,
    });
  });

  return { words, errors };
}

/**
 * Generate direction options from user language preferences
 * Returns array of {value, label} for direction selectors
 */
export function generateDirectionOptions(prefs: UserLanguagePreferences) {
  const main = prefs.mainLanguage;
  const trans1 = prefs.translationLanguages[0] || 'Language 1';
  const trans2 = prefs.translationLanguages[1] || 'Language 2';
  
  return [
    { value: 'main_to_trans1', label: `${main} → ${trans1}` },
    { value: 'trans1_to_main', label: `${trans1} → ${main}` },
    { value: 'main_to_trans2', label: `${main} → ${trans2}` },
    { value: 'trans2_to_main', label: `${trans2} → ${main}` },
  ];
}

/**
 * Map old hardcoded direction format to new generic format
 * Used for backward compatibility with existing data
 */
export function mapOldDirectionToNew(
  oldDirection: string,
  prefs: UserLanguagePreferences
): string {
  // Map old hardcoded directions to new generic format
  const directionMap: Record<string, string> = {
    'german_to_english': 'main_to_trans1',
    'english_to_german': 'trans1_to_main',
    'german_to_bangla': 'main_to_trans2',
    'bangla_to_german': 'trans2_to_main',
  };
  
  return directionMap[oldDirection] || oldDirection;
}
