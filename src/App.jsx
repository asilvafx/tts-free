import { useState, useEffect, useCallback } from 'react'
import VoiceSelector from './components/VoiceSelector'
import { 
  checkSpeechSupport, 
  getVoices, 
  fixChromeSpeechBug,
  isMobileSafari,
  isMobileChrome 
} from './utils/speechUtils'
import { synthesizeAndDownload } from './utils/audioUtils'
import ErrorMessage from './components/ErrorMessage'

export default function App() {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const initializeSpeech = async () => {
      if (!checkSpeechSupport()) {
        setIsSupported(false);
        setError('Text-to-speech is not supported in your browser.');
        return;
      }

      try {
        const availableVoices = await getVoices();
        setVoices(availableVoices);
        fixChromeSpeechBug();
      } catch (err) {
        setError('Failed to load voices. Please refresh the page.');
      }
    };

    initializeSpeech();
  }, []);

  const isInputValid = text.trim() && selectedLanguage && selectedVoice;

  const speakSegment = async (segment, voice) => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.voice = voice;
      
      if (isMobileSafari()) {
        utterance.rate = 0.9;
      }
      
      if (isMobileSafari() || isMobileChrome()) {
        utterance.volume = 1.0;
      }

      utterance.onend = resolve;
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  };

  const sleep = (seconds) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  };

  const downloadAudio = async () => {
    if (!isInputValid || isDownloading) return;

    setError(null);
    setIsDownloading(true);

    try {
      // Process text to handle pauses
      const processedText = text.split(/(\[\d+sec\])/).map(segment => {
        if (segment.match(/^\[\d+sec\]$/)) {
          const seconds = parseInt(segment.match(/\d+/)[0]);
          return ' '.repeat(seconds * 10); // Convert pause to spaces
        }
        return segment;
      }).join(' ');

      await synthesizeAndDownload(processedText, selectedVoice);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to generate audio file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const speak = async () => {
    if (!isInputValid || isSpeaking) return;

    setError(null);
    setIsSpeaking(true);

    const segments = text.split(/(\[\d+sec\])/);

    try {
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].match(/^\[\d+sec\]$/)) {
          const seconds = parseInt(segments[i].match(/\d+/)[0]);
          await sleep(seconds);
        } else if (segments[i].trim()) {
          await speakSegment(segments[i], selectedVoice);
        }
      }
    } catch (error) {
      setError(`Speech failed: ${error.message}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSpeaking) {
        stop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSpeaking, stop]);

  if (!isSupported) {
    return (
      <div className="container">
        <ErrorMessage 
          message="Your browser doesn't support text-to-speech. Please try Chrome, Safari, Firefox, or Edge." 
        />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Text to Speech</h1>
      <p className="hint">Use [Xsec] to add pauses (e.g., [2sec] for 2 seconds)</p>
      
      {error && <ErrorMessage message={error} />}
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak... Example: Hello! [2sec] How are you?"
        aria-label="Text to speak"
      />
      
      <VoiceSelector
        voices={voices}
        selectedVoice={selectedVoice}
        selectedLanguage={selectedLanguage}
        onVoiceChange={setSelectedVoice}
        onLanguageChange={setSelectedLanguage}
      />
      
      <div className="controls">
        {!isSpeaking && (
          <>
            <button 
              onClick={speak} 
              disabled={!isInputValid}
              className="speak-btn"
              aria-label="Speak text"
            >
              Speak
            </button>
            <button 
              onClick={downloadAudio} 
              disabled={!isInputValid || isDownloading}
              className="download-btn"
              aria-label="Download audio"
            >
              {isDownloading ? 'Generating...' : 'Download Audio'}
            </button>
          </>
        )}
        {isSpeaking && (
          <button 
            onClick={stop}
            className="stop-btn"
            aria-label="Stop speaking"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
