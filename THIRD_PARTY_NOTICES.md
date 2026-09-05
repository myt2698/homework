# Third-party notices

## sherpa-onnx Android runtime

The Android application bundles sherpa-onnx 1.13.7 for on-device streaming
speech recognition.

- Project: <https://github.com/k2-fsa/sherpa-onnx>
- License: Apache License 2.0
- Bundled AAR SHA-256: `c4ef49e309f24fcee5c106b8a279481aaecaabb078cd37b2cd6e9a62cc8a73c8`

## Streaming Zipformer Mandarin speech-recognition model

The Android application bundles the int8 files from
`sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23`.

- Model: <https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23>
- License: Apache License 2.0
- Model archive SHA-256: `2cbd71b640d9c37d3784f29367333a4577b0398b62e9deeed418170b081cba8b`
- Encoder SHA-256: `1c556ea57cec304e55ec4b72e52c1cc098bb01476ed7d90f3de939fe126487b1`
- Decoder SHA-256: `22f123bb8cba9b38974b3df18a3f45e7081f4985ebb2e075d9f21f618c468bbf`
- Joiner SHA-256: `a7cf9d82757bdcf786059454495a9ca95e4bd7347f72473fc08d794475c36169`
- Tokens SHA-256: `8b294db9045d6e5f94647f4c1eec1af4da143a75053c399611444b378ff966ac`

Recognition runs locally on the device. Recorded microphone samples are not
sent to a server by this application.
