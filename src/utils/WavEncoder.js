// WAV file encoder
export class WavEncoder {
    constructor(sampleRate = 44100, numChannels = 1) {
        this.sampleRate = sampleRate;
        this.numChannels = numChannels;
        this.numSamples = 0;
        this.dataViews = [];
    }

    encode(buffer) {
        const length = buffer.length;
        const view = new DataView(new ArrayBuffer(length * 2));

        for (let i = 0; i < length; i++) {
            const x = Math.max(-1, Math.min(1, buffer[i]));
            view.setInt16(i * 2, x < 0 ? x * 0x8000 : x * 0x7FFF, true);
        }

        this.dataViews.push(view);
        this.numSamples += length;
    }

    finish() {
        const dataSize = this.numSamples * 2;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // Write WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, this.numChannels, true);
        view.setUint32(24, this.sampleRate, true);
        view.setUint32(28, this.sampleRate * 4, true);
        view.setUint16(32, this.numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write audio data
        let offset = 44;
        for (const dataView of this.dataViews) {
            const dataBuffer = new Uint8Array(dataView.buffer);
            for (let i = 0; i < dataBuffer.length; i++) {
                view.setUint8(offset + i, dataBuffer[i]);
            }
            offset += dataBuffer.length;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
