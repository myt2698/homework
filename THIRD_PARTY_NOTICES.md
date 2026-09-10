# Third-party notices

## Hanzi Writer and offline stroke data

- Hanzi Writer 3.7.3: https://github.com/chanind/hanzi-writer — MIT license.
- hanzi-writer-data 2.0.1: https://github.com/chanind/hanzi-writer-data — ARPHIC PUBLIC LICENSE (APL).
- Data derived from Make Me a Hanzi: https://github.com/skishore/makemeahanzi.
- Font/data copyright: 1999 Arphic Technology Co., Ltd.; Make Me a Hanzi copyright 2016 Shaunak Kishore.
- Unmodified license texts and upstream copying notices are packaged under `web/hanzi/licenses/` and viewable in the lookup screen.
- Pinned npm archive integrity values: `web/hanzi/provenance.json`.

On 2026-09-10 the per-character JSON data was compacted and grouped by Unicode
code point into local JavaScript resources by `scripts/vendor-hanzi.py`.
All 9,574 characters and their original stroke geometry, medians and radical
indices are retained. Every transformed shard includes a modification notice.
The transformed data files are distributed under the same APL terms, without
warranty, as readable JavaScript files in `web/hanzi/data/` (also packaged as
Android assets). The MIT component is shipped unchanged. The lookup UI is
independent application code; the APL applies to the character data.

## sherpa-onnx Android runtime

The repository retains sherpa-onnx 1.13.7 files from the former homework
speech-recognition feature. The runtime is no longer a build dependency.

- Project: <https://github.com/k2-fsa/sherpa-onnx>
- License: Apache License 2.0
- Retained AAR SHA-256: `c4ef49e309f24fcee5c106b8a279481aaecaabb078cd37b2cd6e9a62cc8a73c8`

## Streaming Zipformer Mandarin speech-recognition model

The repository retains historical int8 files from
`sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23`.
They are excluded from the Android application's packaged assets.

- Model: <https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-zh-14M-2023-02-23>
- License: Apache License 2.0
- Model archive SHA-256: `2cbd71b640d9c37d3784f29367333a4577b0398b62e9deeed418170b081cba8b`
- Encoder SHA-256: `1c556ea57cec304e55ec4b72e52c1cc098bb01476ed7d90f3de939fe126487b1`
- Decoder SHA-256: `22f123bb8cba9b38974b3df18a3f45e7081f4985ebb2e075d9f21f618c468bbf`
- Joiner SHA-256: `a7cf9d82757bdcf786059454495a9ca95e4bd7347f72473fc08d794475c36169`
- Tokens SHA-256: `8b294db9045d6e5f94647f4c1eec1af4da143a75053c399611444b378ff966ac`

Homework speech recognition has been removed. The separate dictation and
break-reminder recording features remain local to the device.
