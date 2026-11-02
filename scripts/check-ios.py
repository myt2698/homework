"""Static source/configuration checks only. This is NOT an Xcode build or type check."""
import argparse
import json
from pathlib import Path
import plistlib
import re
import struct
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def read_openstep(path):
    source = re.sub(r'^//.*$', '', path.read_text(encoding='utf-8'), flags=re.M)
    tokens = re.findall(r'"(?:\\.|[^"\\])*"|[{}()=;,]|[A-Za-z0-9_<>.$/+-]+', source)
    cursor = 0

    def take(expected=None):
        nonlocal cursor
        token = tokens[cursor]; cursor += 1
        if expected is not None:
            assert token == expected, (token, expected)
        return token

    def value():
        token = take()
        if token == '{':
            result = {}
            while tokens[cursor] != '}':
                key = value(); take('='); result[key] = value(); take(';')
            take('}'); return result
        if token == '(':
            result = []
            while tokens[cursor] != ')':
                result.append(value()); take(',')
            take(')'); return result
        if token.startswith('"'):
            return json.loads(token)
        return int(token) if token.isdigit() else token

    result = value()
    assert cursor == len(tokens)
    return result


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--parser-path', help='Optional isolated directory containing tree_sitter, tree_sitter_swift and tree_sitter_java')
    options = args.parse_args()
    if options.parser_path:
        sys.path.insert(0, options.parser_path)
    try:
        from tree_sitter import Language, Parser
        import tree_sitter_swift
        import tree_sitter_java
    except ImportError:
        raise SystemExit('Install the three lightweight tree-sitter parser wheels into a temporary directory, then supply --parser-path. No Swift/Xcode/Android SDK required.')
    for extension, folder, language in [('swift', ROOT / 'ios', tree_sitter_swift), ('java', ROOT / 'android/app/src/main/java', tree_sitter_java)]:
        parser = Parser(Language(language.language()))
        files = list(folder.rglob('*.' + extension))
        failures = []
        for path in files:
            tree = parser.parse(path.read_bytes())
            if tree.root_node.has_error:
                pending = [tree.root_node]
                while pending:
                    node = pending.pop()
                    if node.type == 'ERROR' or node.is_missing:
                        failures.append(f'{path.relative_to(ROOT)}:{node.start_point.row + 1}: {node.type}')
                    pending.extend(reversed(node.children))
        if failures:
            raise SystemExit('\n'.join(failures))
        print(f'PASS: {len(files)} {extension} files parsed without syntax errors (not type checked or built).')

    ios = ROOT / 'ios'
    project = read_openstep(ios / 'HomeworkLedger.xcodeproj/project.pbxproj')
    objects = project['objects']; assert project['rootObject'] in objects
    source_files, resource_files = set(), set()
    for key, item in objects.items():
        assert re.fullmatch('[0-9A-F]{24}', key), key
        if item['isa'] == 'PBXFileReference' and item['sourceTree'] == 'SOURCE_ROOT':
            path = (ios / item['path']).resolve()
            assert path.exists(), path
            if path.suffix == '.swift': source_files.add(path)
        if item['isa'] == 'PBXBuildFile':
            assert item['fileRef'] in objects
        for field in ['children', 'files', 'buildConfigurations', 'buildPhases', 'targets']:
            for reference in item.get(field, []): assert reference in objects, reference
        if item['isa'] == 'PBXSourcesBuildPhase':
            compiled = {(ios / objects[objects[ref]['fileRef']]['path']).resolve() for ref in item['files']}
            assert compiled == {p.resolve() for p in (ios / 'HomeworkLedger').rglob('*.swift')}
        if item['isa'] == 'PBXResourcesBuildPhase':
            resource_files = {objects[objects[ref]['fileRef']]['path'] for ref in item['files']}
    assert source_files == {p.resolve() for p in (ios / 'HomeworkLedger').rglob('*.swift')}
    assert '../web/hanzi' in resource_files
    assert 'HomeworkLedger/Resources/lessons.json' in resource_files
    assert not any(p.endswith('Info.plist') for p in resource_files)
    scheme = ET.parse(ios / 'HomeworkLedger.xcodeproj/xcshareddata/xcschemes/HomeworkLedger.xcscheme')
    for node in scheme.findall('.//BuildableReference'): assert node.attrib['BlueprintIdentifier'] in objects
    for file in list(ios.rglob('*.plist')) + list(ios.rglob('*.xcprivacy')):
        with file.open('rb') as stream: plistlib.load(stream)
    info = plistlib.loads((ios / 'HomeworkLedger/Info.plist').read_bytes())
    assert info['NSMicrophoneUsageDescription'] and not info.get('UIBackgroundModes')
    assert info['UIApplicationSceneManifest']['UIApplicationSupportsMultipleScenes'] is False
    for path in (ios / 'HomeworkLedger/Assets.xcassets').rglob('Contents.json'):
        metadata = json.loads(path.read_text())
        for entry in metadata.get('images', []): assert (path.parent / entry['filename']).is_file()
    icon = (ios / 'HomeworkLedger/Assets.xcassets/AppIcon.appiconset/AppIcon.png').read_bytes()
    assert struct.unpack('>II', icon[16:24]) == (1024, 1024)
    print('PASS: project references, resource membership, scheme, property lists and icon metadata.')

    source = (ROOT / 'web/app.js').read_text(encoding='utf-8')
    block = source.split('const DICTATION_LESSONS = [', 1)[1].split('\n  ];', 1)[0]
    expected = [dict(id=i, label=label, words=words.split()) for i, label, words in re.findall(r'\{ id: "([^"]+)", label: "([^"]+)", words: "([^"]+)"\.split', block)]
    lessons = json.loads((ios / 'HomeworkLedger/Resources/lessons.json').read_text(encoding='utf-8'))
    assert lessons == expected
    hanzi = ROOT / 'web/hanzi'
    assert (hanzi / 'index.html').is_file() and (hanzi / 'licenses').is_dir()
    print(f'PASS: {len(lessons)} native lessons / {sum(len(x["words"]) for x in lessons)} words match web source; shared offline Hanzi resources exist.')
    print('NOT RUN: Swift compiler/type checker, Swift unit tests, Xcode build, iOS simulator or device, Android build.')


if __name__ == '__main__':
    main()
