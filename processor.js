class RawAudioProcessor extends AudioWorkletProcessor {
    // Process 128 frames of audio per call
    process(inputs, outputs, parameters) {
      // `inputs[0]` contains raw audio from the source
      const inputChannelData = inputs[0][0]; // First channel of input
  
      if (inputChannelData) {
        // Post the raw audio data back to the main thread
        let total = 0.0
        for (let i = 0; i < inputChannelData.length; i++) {
            total += inputChannelData[i] * inputChannelData[i]
        }

        this.port.postMessage(total / inputChannelData.length);
      }
  
      return true; // Keep the processor running
    }
  }
  
  registerProcessor('raw-audio-processor', RawAudioProcessor);