import { useMicVAD } from "@ricky0123/vad-react";

interface UseVADOptions {
    /** Called when user starts speaking (barge-in trigger) */
    onSpeechStart: () => void;
    /** Called when user stops speaking */
    onSpeechEnd: () => void;
    /** Whether VAD should be active */
    enabled: boolean;
}

/**
 * Voice Activity Detection hook using Silero VAD.
 * Detects when the user starts/stops speaking to enable barge-in
 * (interrupting agent audio when the user begins talking).
 */
export function useVAD({ onSpeechStart, onSpeechEnd, enabled }: UseVADOptions) {
    const vad = useMicVAD({
        startOnLoad: enabled,
        onSpeechStart: () => {
            console.log("[VAD] Speech start detected");
            onSpeechStart();
        },
        onSpeechEnd: () => {
            console.log("[VAD] Speech end detected");
            onSpeechEnd();
        },
        // Tuned for responsive barge-in: lower threshold = faster detection
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.35,
        // Fewer redemption frames = faster end-of-speech detection
        // redemptionFrames: 6,
        redemptionMs: 300,
        // Minimum speech frames to avoid false triggers from short noises
        // minSpeechFrames: 3,
        // Serve model files from /vad/ in public directory
        // modelURL: "/vad/silero_vad_v5.onnx",
        // model: "/vad/silero_vad_v5.onnx",
        // workletURL: "/vad/vad.worklet.bundle.min.js",
        // baseAssetPath: "/vad/",
        onnxWASMBasePath:
            "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
        baseAssetPath:
            "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",

        // ortConfig(ort) {
        //     ort.env.wasm.wasmPaths = "/vad/";
        // },
    });

    return {
        /** Whether the user is currently speaking */
        userSpeaking: vad.userSpeaking,
        /** Whether the VAD model is loaded and ready */
        loading: vad.loading,
        /** Any error during VAD initialization */
        errored: vad.errored,
        /** Start listening */
        start: vad.start,
        /** Pause listening */
        pause: vad.pause,
    };
}
