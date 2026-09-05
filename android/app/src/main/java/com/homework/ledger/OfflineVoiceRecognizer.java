package com.homework.ledger;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.k2fsa.sherpa.onnx.FeatureConfig;
import com.k2fsa.sherpa.onnx.OnlineModelConfig;
import com.k2fsa.sherpa.onnx.OnlineRecognizer;
import com.k2fsa.sherpa.onnx.OnlineRecognizerConfig;
import com.k2fsa.sherpa.onnx.OnlineRecognizerResult;
import com.k2fsa.sherpa.onnx.OnlineStream;
import com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig;

/** Records and recognizes Mandarin entirely on the device. */
final class OfflineVoiceRecognizer {
    interface Listener {
        void onModelReady();
        void onModelError(Throwable error);
        void onPartialResult(String text);
        void onFinalResult(String text);
        void onRecordingError(Throwable error);
    }

    static final int SAMPLE_RATE = 16000;

    private static final String TAG = "OfflineVoiceRecognizer";
    private static final String MODEL_DIR =
            "sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23";
    private static final String ENCODER = MODEL_DIR + "/encoder-epoch-99-avg-1.int8.onnx";
    private static final String DECODER = MODEL_DIR + "/decoder-epoch-99-avg-1.int8.onnx";
    private static final String JOINER = MODEL_DIR + "/joiner-epoch-99-avg-1.int8.onnx";
    private static final String TOKENS = MODEL_DIR + "/tokens.txt";

    private final Context context;
    private final AssetManager assetManager;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Object stateLock = new Object();

    private OnlineRecognizer recognizer;
    private OnlineStream stream;
    private AudioRecord audioRecord;
    private Thread recordingThread;
    private boolean initializing;
    private boolean released;
    private volatile boolean recording;

    OfflineVoiceRecognizer(Context context) {
        this.context = context.getApplicationContext();
        this.assetManager = this.context.getAssets();
    }

    boolean isReady() {
        synchronized (stateLock) {
            return recognizer != null && !released;
        }
    }

    boolean isInitializing() {
        synchronized (stateLock) {
            return initializing;
        }
    }

    boolean isRecording() {
        return recording;
    }

    boolean isBusy() {
        synchronized (stateLock) {
            return recordingThread != null;
        }
    }

    void initialize(Listener listener) {
        synchronized (stateLock) {
            if (released || recognizer != null || initializing) return;
            initializing = true;
        }
        Thread loader = new Thread(() -> {
            OnlineRecognizer created = null;
            Throwable failure = null;
            try {
                created = createRecognizer();
            } catch (Throwable error) {
                failure = error;
                Log.e(TAG, "Unable to initialize offline Mandarin model", error);
            }

            boolean notifyReady = false;
            synchronized (stateLock) {
                initializing = false;
                if (released) {
                    if (created != null) created.release();
                } else if (created != null) {
                    recognizer = created;
                    notifyReady = true;
                }
            }
            if (notifyReady) {
                mainHandler.post(listener::onModelReady);
            } else if (failure != null && !isReleased()) {
                Throwable error = failure;
                mainHandler.post(() -> listener.onModelError(error));
            }
        }, "offline-asr-model-loader");
        loader.start();
    }

    boolean start(Listener listener) {
        OnlineRecognizer activeRecognizer;
        OnlineStream newStream = null;
        AudioRecord recorder = null;
        try {
            synchronized (stateLock) {
                if (released || recognizer == null || recordingThread != null) return false;
                activeRecognizer = recognizer;
            }
            if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                throw new SecurityException("没有麦克风权限");
            }

            int minimumBytes = AudioRecord.getMinBufferSize(
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
            );
            if (minimumBytes <= 0) {
                throw new IllegalStateException("无法确定麦克风缓冲区大小");
            }
            int bufferBytes = Math.max(minimumBytes * 2, SAMPLE_RATE / 5 * 2);
            AudioFormat format = new AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                    .build();
            recorder = new AudioRecord.Builder()
                    .setAudioSource(MediaRecorder.AudioSource.MIC)
                    .setAudioFormat(format)
                    .setBufferSizeInBytes(bufferBytes)
                    .build();
            if (recorder.getState() != AudioRecord.STATE_INITIALIZED) {
                throw new IllegalStateException("麦克风初始化失败");
            }
            newStream = activeRecognizer.createStream("");
            recorder.startRecording();

            AudioRecord threadRecorder = recorder;
            OnlineStream threadStream = newStream;
            synchronized (stateLock) {
                if (released || recordingThread != null) {
                    throw new IllegalStateException("离线语音识别当前不可用");
                }
                audioRecord = recorder;
                stream = newStream;
                recording = true;
                recordingThread = new Thread(
                        () -> processAudio(activeRecognizer, threadRecorder, threadStream, listener),
                        "offline-asr-recorder"
                );
                recordingThread.start();
            }
            return true;
        } catch (Throwable error) {
            recording = false;
            safeStopAndRelease(recorder);
            if (newStream != null) newStream.release();
            Log.e(TAG, "Unable to start offline recognition", error);
            Throwable failure = error;
            mainHandler.post(() -> listener.onRecordingError(failure));
            return false;
        }
    }

    void stop() {
        recording = false;
    }

    void release() {
        OnlineRecognizer recognizerToRelease = null;
        synchronized (stateLock) {
            if (released) return;
            released = true;
            recording = false;
            if (recordingThread == null) {
                recognizerToRelease = recognizer;
                recognizer = null;
            }
        }
        stop();
        if (recognizerToRelease != null) recognizerToRelease.release();
    }

    private OnlineRecognizer createRecognizer() {
        FeatureConfig featureConfig = new FeatureConfig();
        featureConfig.setSampleRate(SAMPLE_RATE);
        featureConfig.setFeatureDim(80);
        featureConfig.setDither(0f);

        OnlineTransducerModelConfig transducer = new OnlineTransducerModelConfig();
        transducer.setEncoder(ENCODER);
        transducer.setDecoder(DECODER);
        transducer.setJoiner(JOINER);

        OnlineModelConfig modelConfig = new OnlineModelConfig();
        modelConfig.setTransducer(transducer);
        modelConfig.setTokens(TOKENS);
        modelConfig.setNumThreads(Math.max(1, Math.min(4,
                Runtime.getRuntime().availableProcessors() / 2)));
        modelConfig.setDebug(false);
        modelConfig.setProvider("cpu");

        OnlineRecognizerConfig config = new OnlineRecognizerConfig();
        config.setFeatConfig(featureConfig);
        config.setModelConfig(modelConfig);
        config.setEnableEndpoint(false);
        config.setDecodingMethod("greedy_search");
        config.setMaxActivePaths(4);
        return new OnlineRecognizer(assetManager, config);
    }

    private void processAudio(
            OnlineRecognizer activeRecognizer,
            AudioRecord recorder,
            OnlineStream activeStream,
            Listener listener
    ) {
        String latestText = "";
        long acceptedSamples = 0;
        try {
            short[] buffer = new short[SAMPLE_RATE / 10];
            while (recording && isActiveRecorder(recorder)) {
                int count = recorder.read(buffer, 0, buffer.length);
                if (count < 0) {
                    if (recording) throw new IllegalStateException("读取麦克风数据失败：" + count);
                    break;
                }
                if (count == 0) continue;
                acceptedSamples += count;
                float[] samples = new float[count];
                for (int index = 0; index < count; index++) {
                    samples[index] = buffer[index] / 32768f;
                }
                activeStream.acceptWaveform(samples, SAMPLE_RATE);
                while (activeRecognizer.isReady(activeStream)) {
                    activeRecognizer.decode(activeStream);
                }
                OnlineRecognizerResult result = activeRecognizer.getResult(activeStream);
                String text = cleanResult(result == null ? "" : result.getText());
                if (!text.equals(latestText)) {
                    latestText = text;
                    String partial = latestText;
                    mainHandler.post(() -> listener.onPartialResult(partial));
                }
            }

            if (acceptedSamples >= SAMPLE_RATE / 5) {
                activeStream.inputFinished();
                while (activeRecognizer.isReady(activeStream)) {
                    activeRecognizer.decode(activeStream);
                }
                OnlineRecognizerResult result = activeRecognizer.getResult(activeStream);
                latestText = cleanResult(result == null ? "" : result.getText());
            }
            if (!isReleased()) {
                String finalText = latestText;
                mainHandler.post(() -> listener.onFinalResult(finalText));
            }
        } catch (Throwable error) {
            Log.e(TAG, "Offline recognition failed", error);
            if (!isReleased()) {
                Throwable failure = error;
                mainHandler.post(() -> listener.onRecordingError(failure));
            }
        } finally {
            recording = false;
            safeStopAndRelease(recorder);
            activeStream.release();
            OnlineRecognizer recognizerToRelease = null;
            synchronized (stateLock) {
                if (audioRecord == recorder) audioRecord = null;
                if (stream == activeStream) stream = null;
                if (recordingThread == Thread.currentThread()) recordingThread = null;
                if (released && recognizer == activeRecognizer) {
                    recognizerToRelease = recognizer;
                    recognizer = null;
                }
            }
            if (recognizerToRelease != null) recognizerToRelease.release();
        }
    }

    private boolean isReleased() {
        synchronized (stateLock) {
            return released;
        }
    }

    private boolean isActiveRecorder(AudioRecord recorder) {
        synchronized (stateLock) {
            return audioRecord == recorder;
        }
    }

    private static String cleanResult(String value) {
        return value == null ? "" : value.trim();
    }

    private static void safeStopAndRelease(AudioRecord recorder) {
        if (recorder == null) return;
        try {
            if (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                recorder.stop();
            }
        } catch (IllegalStateException ignored) {
            // Continue with release.
        }
        recorder.release();
    }
}
