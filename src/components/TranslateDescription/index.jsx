// TranslateDescription.jsx
import React, { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useTranslation } from 'react-i18next';

const TranslateDescription = ({ description }) => {
  const { t, i18n } = useTranslation(['storefront']);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [showOriginal, setShowOriginal] = useState(true);

  const handleTranslate = useCallback(async () => {
    if (translatedText) {
      setShowOriginal(false);
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const functions = getFunctions();
      // FIX #1: Use the exact, all-lowercase function name
      const translateTextCallable = httpsCallable(functions, 'translatetext');
      
      const result = await translateTextCallable({
        text: description,
        targetLang: i18n.language.split('-')[0] || 'en',
      });

      // FIX #2: Check if the function returned an error or the expected data
      if (result.data.error) {
        // This handles cases where the function returns an error message instead of throwing one.
        throw new Error(result.data.error);
      } else if (result.data.translatedText) {
        setTranslatedText(result.data.translatedText);
        setShowOriginal(false);
      } else {
        // Handle unexpected successful response structure
        throw new Error("Received an invalid response from the translation service.");
      }

    } catch (err) {
      console.error('Translation error:', err);
      // Use the error message from the function if it exists, otherwise use the generic one.
      setError(err.message || t('translationError', 'Could not translate description.'));
    } finally {
      setIsTranslating(false);
    }
  }, [description, translatedText, i18n.language, t]);

  const currentDescription = showOriginal ? description : translatedText;
  const noDescriptionText = t('noDescription', 'No description available.');

  if (!description) {
    return <p>{noDescriptionText}</p>;
  }

  return (
    <>
      <p>{currentDescription}</p>
      {/* <div className="translation-controls">
        {isTranslating ? (
          <span className="translating-indicator">{t('translating', 'Translating...')}</span>
        ) : (
          <>
            {showOriginal ? (
              <button onClick={handleTranslate} className="translate-button">
                {t('translateDescription', 'Translate')}
              </button>
            ) : (
              <button onClick={() => setShowOriginal(true)} className="translate-button">
                {t('showOriginal', 'Show Original')}
              </button>
            )}
            {error && <span className="translation-error">{error}</span>}
          </>
        )}
      </div> */}
    </>
  );
};

export default TranslateDescription;