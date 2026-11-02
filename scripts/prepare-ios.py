"""Refresh the checked-in Xcode project and word list; does not build anything."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
IOS = ROOT / 'ios'
APP = IOS / 'HomeworkLedger'


def identifier(name):
    return hashlib.sha256(name.encode()).hexdigest()[:24].upper()


def plist(value, depth=0):
    indent = '\t' * depth
    if isinstance(value, dict):
        return '{\n' + ''.join(f'{indent}\t{json.dumps(str(k))} = {plist(v, depth + 1)};\n' for k, v in value.items()) + indent + '}'
    if isinstance(value, list):
        return '(\n' + ''.join(f'{indent}\t{plist(v, depth + 1)},\n' for v in value) + indent + ')'
    if isinstance(value, int):
        return str(value)
    return json.dumps(value, ensure_ascii=False)


def main():
    source = (ROOT / 'web/app.js').read_text(encoding='utf-8')
    block = source.split('const DICTATION_LESSONS = [', 1)[1].split('\n  ];', 1)[0]
    lessons = [dict(id=i, label=label, words=words.split()) for i, label, words in
               re.findall(r'\{ id: "([^"]+)", label: "([^"]+)", words: "([^"]+)"\.split', block)]
    if len(lessons) != 25 or sum(len(x['words']) for x in lessons) != 318:
        raise SystemExit('Unexpected word-list shape; review the web and native curricula before regeneration.')
    resources = APP / 'Resources'
    resources.mkdir(parents=True, exist_ok=True)
    (resources / 'lessons.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    objects = {}

    def add(unique_name, isa, **values):
        key = identifier(unique_name)
        objects[key] = {'isa': isa, **values}
        return key

    source_refs, source_builds = [], []
    for file in sorted(APP.rglob('*.swift')):
        path = file.relative_to(IOS).as_posix()
        ref = add('file:' + path, 'PBXFileReference', lastKnownFileType='sourcecode.swift', path=path, sourceTree='SOURCE_ROOT')
        source_refs.append(ref)
        source_builds.append(add('build:' + path, 'PBXBuildFile', fileRef=ref))
    resource_refs, resource_builds = [], []
    for path, kind in [('HomeworkLedger/Resources/lessons.json', 'text.json'),
                       ('HomeworkLedger/Assets.xcassets', 'folder.assetcatalog'),
                       ('HomeworkLedger/PrivacyInfo.xcprivacy', 'text.xml'),
                       ('../web/hanzi', 'folder')]:
        ref = add('file:' + path, 'PBXFileReference', lastKnownFileType=kind, path=path, sourceTree='SOURCE_ROOT')
        resource_refs.append(ref)
        resource_builds.append(add('build:' + path, 'PBXBuildFile', fileRef=ref))
    info = add('info', 'PBXFileReference', lastKnownFileType='text.plist.xml', path='HomeworkLedger/Info.plist', sourceTree='SOURCE_ROOT')
    frameworks, framework_builds = [], []
    for name in ['Foundation', 'SwiftUI', 'UIKit', 'AVFoundation', 'WebKit', 'UserNotifications', 'CryptoKit']:
        ref = add('framework:' + name, 'PBXFileReference', lastKnownFileType='wrapper.framework',
                  path=f'System/Library/Frameworks/{name}.framework', sourceTree='SDKROOT')
        frameworks.append(ref); framework_builds.append(add('framework-build:' + name, 'PBXBuildFile', fileRef=ref))
    product = add('product', 'PBXFileReference', explicitFileType='wrapper.application', includeInIndex=0, path='HomeworkLedger.app', sourceTree='BUILT_PRODUCTS_DIR')
    groups = [add('sources-group', 'PBXGroup', children=source_refs, name='Sources', sourceTree='<group>'),
              add('resources-group', 'PBXGroup', children=resource_refs + [info], name='Resources', sourceTree='<group>'),
              add('frameworks-group', 'PBXGroup', children=frameworks, name='Frameworks', sourceTree='<group>')]
    products = add('products-group', 'PBXGroup', children=[product], name='Products', sourceTree='<group>')
    main_group = add('main-group', 'PBXGroup', children=groups + [products], sourceTree='<group>')
    phases = []
    for kind, builds in [('Sources', source_builds), ('Frameworks', framework_builds), ('Resources', resource_builds)]:
        phases.append(add(kind + '-phase', 'PBX' + kind + 'BuildPhase', buildActionMask=2147483647, files=builds, runOnlyForDeploymentPostprocessing=0))
    project_configs, target_configs = [], []
    for mode in ['Debug', 'Release']:
        settings = {'CLANG_ENABLE_MODULES': 'YES', 'CLANG_ENABLE_OBJC_ARC': 'YES', 'SDKROOT': 'iphoneos',
                    'IPHONEOS_DEPLOYMENT_TARGET': '16.0', 'SWIFT_VERSION': '5.0',
                    'SWIFT_OPTIMIZATION_LEVEL': '-Onone' if mode == 'Debug' else '-O',
                    'DEBUG_INFORMATION_FORMAT': 'dwarf' if mode == 'Debug' else 'dwarf-with-dsym',
                    'ENABLE_TESTABILITY': 'YES' if mode == 'Debug' else 'NO',
                    'SWIFT_ACTIVE_COMPILATION_CONDITIONS': 'DEBUG' if mode == 'Debug' else ''}
        project_configs.append(add('project-' + mode, 'XCBuildConfiguration', buildSettings=settings, name=mode))
        target_settings = {'PRODUCT_NAME': '$(TARGET_NAME)', 'PRODUCT_BUNDLE_IDENTIFIER': 'com.homework.ledger.ios',
                           'INFOPLIST_FILE': 'HomeworkLedger/Info.plist', 'GENERATE_INFOPLIST_FILE': 'NO',
                           'CODE_SIGN_STYLE': 'Automatic', 'TARGETED_DEVICE_FAMILY': '1,2',
                           'SUPPORTED_PLATFORMS': 'iphoneos iphonesimulator', 'SUPPORTS_MACCATALYST': 'NO',
                           'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon',
                           'ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME': 'AccentColor',
                           'LD_RUNPATH_SEARCH_PATHS': ['$(inherited)', '@executable_path/Frameworks'],
                           'CURRENT_PROJECT_VERSION': '1', 'MARKETING_VERSION': '1.0'}
        target_configs.append(add('target-' + mode, 'XCBuildConfiguration', buildSettings=target_settings, name=mode))
    project_list = add('project-config-list', 'XCConfigurationList', buildConfigurations=project_configs, defaultConfigurationIsVisible=0, defaultConfigurationName='Release')
    target_list = add('target-config-list', 'XCConfigurationList', buildConfigurations=target_configs, defaultConfigurationIsVisible=0, defaultConfigurationName='Release')
    target = add('app-target', 'PBXNativeTarget', buildConfigurationList=target_list, buildPhases=phases,
                 buildRules=[], dependencies=[], name='HomeworkLedger', productName='HomeworkLedger',
                 productReference=product, productType='com.apple.product-type.application')
    project = add('project', 'PBXProject', attributes={'BuildIndependentTargetsInParallel': 'YES', 'LastUpgradeCheck': '1600'},
                  buildConfigurationList=project_list, compatibilityVersion='Xcode 14.0', developmentRegion='zh_CN',
                  hasScannedForEncodings=0, knownRegions=['zh_CN', 'en', 'Base'], mainGroup=main_group,
                  productRefGroup=products, projectDirPath='', projectRoot='', targets=[target])
    folder = IOS / 'HomeworkLedger.xcodeproj'; folder.mkdir(parents=True, exist_ok=True)
    (folder / 'project.pbxproj').write_text('// !$*UTF8*$!\n' + plist({'archiveVersion': 1, 'classes': {}, 'objectVersion': 56, 'objects': objects, 'rootObject': project}) + '\n', encoding='utf-8')
    schemes = folder / 'xcshareddata/xcschemes'; schemes.mkdir(parents=True, exist_ok=True)
    reference = f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="HomeworkLedger.app" BlueprintName="HomeworkLedger" ReferencedContainer="container:HomeworkLedger.xcodeproj"/>'
    (schemes / 'HomeworkLedger.xcscheme').write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
 <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{reference}</BuildActionEntry></BuildActionEntries></BuildAction>
 <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables/></TestAction>
 <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></LaunchAction>
 <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></ProfileAction>
 <AnalyzeAction buildConfiguration="Debug"/>
 <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
''', encoding='utf-8')
    print(f'Prepared Xcode source references ({len(source_refs)} Swift files) and {len(lessons)} lessons. No build performed.')


if __name__ == '__main__':
    main()
