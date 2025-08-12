export const checkSpeechSupport = () => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

export const isMobileSafari = () => {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !window.MSStream && /Safari/.test(ua);
};

export const isMobileChrome = () => {
  const ua = navigator.userAgent;
  return /Android/.test(ua) && /Chrome/.test(ua);
};

export const getVoices = () => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
      return;
    }
    
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
  });
};

// Fix for Chrome cutting off speech
export const fixChromeSpeechBug = () => {
  const isChromeOrEdge = /Chrome/.test(navigator.userAgent) || /Edg/.test(navigator.userAgent);
  if (!isChromeOrEdge) return;

  let utterance = new SpeechSynthesisUtterance("");
  
  // Chrome/Edge bug workaround: Keeps speech synthesis active
  setInterval(() => {
    if (!speechSynthesis.speaking) return;
    speechSynthesis.pause();
    speechSynthesis.resume();
  }, 5000);
};

export const createSilentAudioContext = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Set gain to 0 to make it silent
  gainNode.gain.value = 0;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  return {
    audioContext,
    oscillator,
    gainNode,
    start: () => oscillator.start(),
    stop: () => {
      oscillator.stop();
      audioContext.close();
    }
  };
};