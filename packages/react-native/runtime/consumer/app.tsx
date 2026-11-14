import {AppRegistry, ScrollView} from 'react-native';

import {
  QRCodeGIF,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  QRCodeWebP,
  type QRCodeSVGOptions,
  rounded,
} from '@qrcodesdk/react-native';

const options: QRCodeSVGOptions = {
  style: {moduleSize: 4, modules: rounded()},
  accessibility: {ariaLabel: 'Scan to open qrcodesdk.dev'},
};

function App() {
  return (
    <ScrollView>
      <QRCodeSVG payload="https://qrcodesdk.dev" options={options} />
      <QRCodePNG payload="https://qrcodesdk.dev" options={options} />
      <QRCodeWebP payload="https://qrcodesdk.dev" options={options} />
      <QRCodeGIF payload="https://qrcodesdk.dev" options={options} />
      <QRCodeJPEG payload="https://qrcodesdk.dev" options={options} />
    </ScrollView>
  );
}

AppRegistry.registerComponent('QRCodeSDKSmoke', () => App);
