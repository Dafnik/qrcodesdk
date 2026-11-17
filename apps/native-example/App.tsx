import {useRef, useState} from 'react';
import {Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  QRCodeGIF,
  type QRCodeImageHandle,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  type QRCodeSVGOptions,
  QRCodeWebP,
  rounded,
  svgCenterImage,
} from '@qrcodesdk/react-native';

import fixtures from './fixtures.json';
import logo from './assets/qrcodesdk-logo.png';

// Metro bundles the same QRCodeSDK logo used by the docs, with no network request.
const centerImage = svgCenterImage(logo, {size: 0.25});
const renderers = {png: QRCodePNG, webp: QRCodeWebP, gif: QRCodeGIF, jpeg: QRCodeJPEG};

export default function App() {
  const [selected, setSelected] = useState(fixtures[0]);
  const [updated, setUpdated] = useState(false);
  const [exported, setExported] = useState(false);
  const image = useRef<QRCodeImageHandle>(null);
  const payload = selected.payload + (updated ? '?updated=1' : '');
  const options: QRCodeSVGOptions = {
    matrix: {errorCorrectionLevel: 'H'},
    style: {moduleSize: 5, ...(selected.id === 'styled' ? {modules: rounded()} : {})},
    ...(selected.id === 'center' ? {centerImage} : {}),
    accessibility: {ariaLabel: `QR code for ${selected.label}`},
  };
  const Renderer = renderers[selected.format as keyof typeof renderers];

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
            {fixtures.map((fixture) => (
              <Pressable
                key={fixture.id}
                testID={`select-${fixture.id}`}
                accessibilityRole="button"
                accessibilityState={{selected: selected.id === fixture.id}}
                onPress={() => {
                  setSelected(fixture);
                  setUpdated(false);
                  setExported(false);
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
            {selected.format === 'svg' ? (
              <QRCodeSVG payload={payload} options={options} />
            ) : (
              <Renderer
                ref={image}
                payload={payload}
                options={{
                  matrix: options.matrix,
                  style: options.style,
                  accessibility: options.accessibility,
                }}
              />
            )}
          </View>
          <Text testID="fixture-name" style={styles.caption}>
            {selected.label}
            {updated ? ' updated' : ''}
          </Text>
          <Text style={styles.payload}>{payload}</Text>
          <Pressable
            testID="update-payload"
            accessibilityRole="button"
            style={styles.action}
            onPress={() => {
              setUpdated(!updated);
              setExported(false);
            }}>
            <Text style={styles.actionText}>Change payload</Text>
          </Pressable>
          {selected.format !== 'svg' && (
            <Pressable
              testID="export-image"
              accessibilityRole="button"
              style={styles.action}
              onPress={() => {
                setExported(
                  Boolean(
                    image.current?.toDataURL().startsWith(`data:image/${selected.format};base64,`),
                  ),
                );
              }}>
              <Text style={styles.actionText}>Check image export</Text>
            </Pressable>
          )}
          {exported && (
            <Text testID="export-success" style={styles.caption}>
              Image export ready
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#f4f3ee'},
  content: {padding: 24, gap: 16, alignItems: 'stretch'},
  eyebrow: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#59645c',
    fontSize: 12,
  },
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
  caption: {fontSize: 16, fontWeight: '600', color: '#16281e'},
  payload: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#59645c',
  },
  action: {paddingVertical: 14, borderTopWidth: 1, borderColor: '#b7bfb6'},
  actionText: {fontSize: 15, color: '#245e43', fontWeight: '600'},
});
