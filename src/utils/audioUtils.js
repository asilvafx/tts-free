import { WavEncoder } from './WavEncoder';

export async function synthesizeAndDownload(text, voice) {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const encoder = new WavEncoder(audioContext.sampleRate);

      // Create audio nodes
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      // Connect nodes
      gainNode.connect(analyser);
      analyser.connect(destination);
      gainNode.connect(audioContext.destination);

      // Create processor to capture audio
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      // Process and encode audio
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        encoder.encode(inputData);
      };

      // Configure speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;

      // Handle speech events
      utterance.onend = () => {
        // Wait a bit to ensure we capture all audio
        setTimeout(() => {
          processor.disconnect();
          gainNode.disconnect();
          analyser.disconnect();
          audioContext.close();

          // Generate and download WAV file
          const wavBlob = encoder.finish();
          const url = URL.createObjectURL(wavBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'text-to-speech.wav';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, 200);
      };

      utterance.onerror = (error) => {
        processor.disconnect();
        gainNode.disconnect();
        analyser.disconnect();
        audioContext.close();
        reject(error);
      };

      // Start speech synthesis
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Synthesis error:', error);
      reject(error);
    }
  });
}
