/**
 * Utility for handling MediaRecorder logic
 */
export function createRecorder(canvas, fps, audioStream, onComplete, onError) {
    const chunks = [];
    let stream;
    
    try {
        stream = canvas.captureStream(fps);
        
        // Audio Injection
        if (audioStream) {
            try {
                audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (e) {
                console.warn("Could not attach audio stream", e);
            }
        }
    } catch (e) {
        if (onError) onError("Stream capture failed: " + e.message);
        return null;
    }

    const mimeTypes = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
    const selectedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";
    
    let recorder;
    try {
        recorder = new MediaRecorder(stream, selectedType ? { mimeType: selectedType, videoBitsPerSecond: 8000000 } : {}); // 8Mbps
    } catch (e) {
        if (onError) onError("MediaRecorder init failed: " + e.message);
        return null;
    }

    recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedType || 'video/webm' });
        if (blob.size < 1000) {
            if (onError) onError("Video empty (Blob < 1KB)");
        } else {
            const url = URL.createObjectURL(blob);
            if (onComplete) onComplete(url);
        }
    };

    return recorder;
}