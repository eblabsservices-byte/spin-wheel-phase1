
export const getDeviceSignals = async () => {
    if (typeof window === 'undefined') return null;

    let gpuRenderer = 'unknown';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            // @ts-ignore
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                // @ts-ignore
                gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) {
        console.warn('GPU Fingerprint failed', e);
    }

    return {
        screen: `${window.screen.width}x${window.screen.height}`,
        gpu: gpuRenderer,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        // We do strictly hardware signals. User Agent is added by browser automatically in headers.
    };
};
