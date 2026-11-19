import {useMemo, useRef, useState} from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  QRCodeGIF,
  type QRCodeImageHandle,
  type QRCodeImageOptions,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  type QRCodeSVGOptions,
  QRCodeWebP,
  rasterCenterImage,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/react-native';

import {centerLogoPNG} from './center-logo';
import fixtures from './fixtures.json';
import logo from './assets/qrcodesdk-logo.png';

type Fixture = {
  readonly format: 'svg' | keyof typeof renderers;
  readonly id: string;
  readonly label: string;
  readonly payload: string;
  /** Show the QRCodeSDK logo as a center image. */
  readonly logo?: boolean;
  /** Draw rounded modules. */
  readonly rounded?: boolean;
};

const renderers = {png: QRCodePNG, webp: QRCodeWebP, gif: QRCodeGIF, jpeg: QRCodeJPEG};
const cases = fixtures.cases as readonly Fixture[];
const {update} = fixtures;
// Metro bundles the same QRCodeSDK logo used by the docs, with no network request. The image
// components need PNG bytes, so they use an embedded small copy of the same logo.
const svgLogo = svgCenterImage(logo, {size: 0.25});
const rasterLogo = rasterCenterImage(
  Uint8Array.from(atob(centerLogoPNG), (character) => character.charCodeAt(0)),
  {size: 0.25},
);
const monospace = Platform.select({ios: 'Menlo', default: 'monospace'});

export default function App() {
  const [selected, setSelected] = useState(cases[0]!);
  const [updated, setUpdated] = useState(false);
  const [exported, setExported] = useState<string>();
  const image = useRef<QRCodeImageHandle>(null);
  const payload = selected.payload + (updated ? update.suffix : '');
  // Tie the load event to this preview so the previous image cannot make the next one ready.
  const previewSource = useMemo(() => ({payload, exported}), [payload, exported]);
  const [loadedPreview, setLoadedPreview] = useState<typeof previewSource>();
  const onImageLoad = () => setLoadedPreview(previewSource);
  const options = useMemo(() => {
    const shared = {
      matrix: {errorCorrectionLevel: 'H'},
      style: {moduleSize: 5, ...(selected.rounded ? {modules: rounded()} : {})},
      accessibility: {ariaLabel: `QR code for ${selected.label}`},
    } as const;
    return {
      svg: {...shared, ...(selected.logo ? {centerImage: svgLogo} : {})} as QRCodeSVGOptions,
      image: {...shared, ...(selected.logo ? {centerImage: rasterLogo} : {})} as QRCodeImageOptions,
    };
  }, [selected]);
  const Renderer = selected.format === 'svg' ? undefined : renderers[selected.format];
  const previewReady = !Renderer || loadedPreview === previewSource;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.page}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>QRCODESDK / {Platform.OS.toUpperCase()}</Text>
          <Text style={styles.heading}>Native rendering</Text>
          <Text style={styles.description}>
            Choose an output. Scan the code to check the result.
          </Text>
          <View style={styles.choices}>
            {cases.map((fixture) => (
              <Pressable
                key={fixture.id}
                testID={`select-${fixture.id}`}
                accessibilityRole="button"
                accessibilityState={{selected: selected.id === fixture.id}}
                onPress={() => {
                  setSelected(fixture);
                  setUpdated(false);
                  setExported(undefined);
                }}
                style={[styles.choice, selected.id === fixture.id && styles.selected]}>
                <Text
                  style={[styles.choiceText, selected.id === fixture.id && styles.selectedText]}>
                  {fixture.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.preview}>
            {exported ? (
              // Show only the exported bytes, so a screenshot cannot decode the live component.
              <Image
                testID="exported-image"
                accessibilityLabel={`Exported ${selected.label} image`}
                source={{uri: previewSource.exported}}
                onLoad={onImageLoad}
                resizeMode="contain"
                style={styles.exported}
              />
            ) : Renderer ? (
              <Renderer
                ref={image}
                payload={previewSource.payload}
                options={options.image}
                onLoad={onImageLoad}
              />
            ) : (
              <QRCodeSVG payload={payload} options={options.svg} />
            )}
          </View>
          <Text testID={previewReady ? 'fixture-name' : undefined} style={styles.caption}>
            {selected.label}
            {updated ? ' updated' : ''}
            {exported ? ' exported' : ''}
          </Text>
          <Text style={styles.payload}>{payload}</Text>
          <Pressable
            testID="update-payload"
            accessibilityRole="button"
            style={styles.action}
            onPress={() => {
              setUpdated(!updated);
              setExported(undefined);
            }}>
            <Text style={styles.actionText}>Change payload</Text>
          </Pressable>
          {Renderer && !exported && (
            <Pressable
              testID="export-image"
              accessibilityRole="button"
              style={styles.action}
              onPress={() => {
                const uri = image.current?.toDataURL();
                // A wrong MIME type leaves the live component in place, so the flow fails.
                if (uri?.startsWith(`data:image/${selected.format};base64,`)) setExported(uri);
              }}>
              <Text style={styles.actionText}>Show exported image</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#f4f3ee'},
  content: {padding: 24, gap: 16, alignItems: 'stretch'},
  eyebrow: {fontFamily: monospace, color: '#59645c', fontSize: 12},
  heading: {fontSize: 32, fontWeight: '700', color: '#16281e', letterSpacing: -1},
  description: {fontSize: 15, lineHeight: 22, color: '#59645c'},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#b7bfb6',
    borderRadius: 4,
  },
  selected: {backgroundColor: '#245e43', borderColor: '#245e43'},
  choiceText: {fontSize: 14, color: '#16281e'},
  selectedText: {color: '#ffffff'},
  preview: {
    backgroundColor: '#ffffff',
    minHeight: 264,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  exported: {width: 232, height: 232},
  caption: {fontSize: 16, fontWeight: '600', color: '#16281e'},
  payload: {fontFamily: monospace, fontSize: 11, color: '#59645c'},
  action: {paddingVertical: 14, borderTopWidth: 1, borderColor: '#b7bfb6'},
  actionText: {fontSize: 15, color: '#245e43', fontWeight: '600'},
});
