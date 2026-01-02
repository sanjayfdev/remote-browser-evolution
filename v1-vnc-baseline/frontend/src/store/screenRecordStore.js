import { create } from "zustand";

const useScreenRecord = create((set, get) => ({
    isRecording: false,
    mediaStream: null,
    mediaRecorder: null,
    recordedChunks: [],

    startRecording: async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "monitor"
                },
                audio: true,
            });

            const mediaRecorder = new MediaRecorder(stream);
            set({ isRecording: true, mediaStream: stream, mediaRecorder, recordedChunks: [] });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    set((state) => ({ recordedChunks: [...state.recordedChunks, e.data] }));
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(get().recordedChunks, { type: "video/webm" });
                get().handleSave(blob);
            };

            mediaRecorder.start();
        } catch (err) {
            console.error("Error starting recording:", err);
        }
    },

    stopRecording: () => {
        const { mediaRecorder, mediaStream } = get();
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        mediaStream?.getTracks().forEach((track) => track.stop());
        set({ isRecording: false, mediaStream: null, mediaRecorder: null, recordedChunks: [] });
    },

    handleSave: (blob) => {
        try {
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = Date.now() + "-recording.webm"; // file name
            document.body.appendChild(a);
            a.click(); 
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            alert("File downloaded successfully!");
        } catch (err) {
            console.error("Download failed:", err);
        }
    },

}));

export default useScreenRecord;
