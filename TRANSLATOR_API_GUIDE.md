# Browser Translator API Integration Guide

## Overview

This document explains the implementation of the browser's native **Translator API** for translating example sentences in the word list view modal. This is a **no-API, no-callback** solution using the browser's built-in AI capabilities.

## What is the Translator API?

The **Translator API** is a modern browser API that allows you to translate text locally in the browser without making external API calls. It uses the browser's built-in AI model for fast, privacy-preserving translations.

- **Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Translator
- **Status**: Experimental (Chrome/Edge support as of 2025)
- **Privacy**: All translations happen locally on the device

## Browser Support

### Current Support
- ✅ **Chrome/Edge** (latest versions with AI features enabled)
- ❌ **Firefox**: Not supported yet
- ❌ **Safari**: Not supported yet

### Browser Requirements
1. Use **Chrome 128+** or **Edge 128+**
2. Enable AI features (usually enabled by default in recent versions)
3. HTTPS context required for production

## Implementation Details

### How It Works

The implementation is in `src/components/words/word-list.tsx`:

```tsx
// 1. Check if API is available in the browser
if (typeof (window as any).Translator === "undefined") {
  // API not available, skip translation
  return;
}

// 2. Check if the language pair is available
const availability = await Translator.availability({
  sourceLanguage: "en",
  targetLanguage: "de",
});

// 3. Create a translator instance (downloads model if needed)
const translator = await Translator.create({
  sourceLanguage: "en",
  targetLanguage: "de",
});

// 4. Translate the text
const translation = await translator.translate(exampleSentence);

// 5. Clean up resources
translator.destroy();
```

### Usage in WordList Component

When a user views a word in the modal, the component:

1. **Detects** when `viewIndex` changes (user opens word details)
2. **Fetches** the example sentence if it exists
3. **Checks** if the Translator API is available in the browser
4. **Translates** the sentence from English to German
5. **Displays** the translation below the original sentence
6. **Handles errors** gracefully (missing API, model unavailable, etc.)

### State Management

```tsx
const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null);
const [translationLoading, setTranslationLoading] = useState(false);
```

- `sentenceTranslation`: Stores the translated text
- `translationLoading`: Shows "Translating..." while model processes

### Effect Hook

```tsx
useEffect(() => {
  // Cleanup: clear translation when closing modal
  if (viewIndex === null) {
    setSentenceTranslation(null);
    return;
  }

  // Skip if no sentence
  const sentence = words[viewIndex]?.exampleSentence;
  if (!sentence) {
    setSentenceTranslation(null);
    return;
  }

  // Translate on word change
  translateSentence();
}, [viewIndex, words]);
```

## Current Configuration

- **Source Language**: English (`en`)
- **Target Language**: German (`de`)
- **Auto-cleanup**: Translator instance destroyed after translation

## Making It Configurable

To support multiple target languages, modify the translation function:

```tsx
const translateSentence = async (targetLang: string = "de") => {
  // ... check availability ...
  const translator = await Translator.create({
    sourceLanguage: "en",
    targetLanguage: targetLang, // Dynamic language
  });
  // ... rest of code ...
};
```

## Error Handling

The implementation gracefully handles:

1. **API not available**: Silently skips translation
2. **Language pair unavailable**: Logs to console, no translation shown
3. **Translation failure**: Logs error, shows no translation
4. **Quota exceeded**: Browser quota system prevents abuse

## Performance Considerations

### Model Download
- First use may trigger a model download (10-100 MB depending on languages)
- Download progress is logged to console
- Subsequent uses are instant

### Quotas
- Browser enforces daily input quotas (typically generous)
- Can check quota before translating:

```tsx
const totalQuota = translator.inputQuota;
const usage = await translator.measureInputUsage(sentence);

if (usage > totalQuota) {
  throw new Error("Translation quota exceeded");
}
```

### Memory Usage
- Models are cached by the browser after download
- Call `translator.destroy()` to free resources (implemented)

## Testing

### Local Testing (Chrome/Edge)
1. Open DevTools (F12)
2. Go to `chrome://flags` (Chrome) or `edge://flags` (Edge)
3. Search for "Translator API"
4. Enable the flag if available
5. Restart browser
6. Navigate to the app and view a word with example sentence

### Production Considerations
- API availability varies by browser and region
- Users without support see no translation (graceful degradation)
- No API keys or backend calls required
- No translation logs or data collection

## Fallback Strategy

If you want to provide fallback translation for unsupported browsers, you can:

1. **Keep existing API calls** for users without Translator API support
2. **Hybrid approach**:
   ```tsx
   // Try browser API first
   const translation = await translateWithBrowserAPI();
   
   // Fallback to server if needed
   if (!translation) {
     const fallback = await fetch('/api/translate', {...});
   }
   ```

## Future Enhancements

1. **User language selection**: Let users choose target language
2. **Cache translations**: Store translations in localStorage
3. **Batch translations**: Translate multiple sentences at once
4. **Language detection**: Auto-detect sentence language before translating
5. **Streaming translations**: Use `translateStreaming()` for large texts

## Resources

- [MDN Translator API](https://developer.mozilla.org/en-US/docs/Web/API/Translator)
- [MDN Usage Guide](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs/Using)
- [Browser Compatibility](https://caniuse.com/translator-api) (caniuse.com)

## Summary

✅ **Advantages**:
- No backend API calls needed
- Fully private (all processing on-device)
- Zero latency after model download
- No API keys or external dependencies

⚠️ **Limitations**:
- Experimental/not available in all browsers
- Requires modern Chrome/Edge
- First use downloads model (one-time cost)
- Subject to browser quotas

This is an excellent feature for modern browsers while gracefully degrading for older ones!
