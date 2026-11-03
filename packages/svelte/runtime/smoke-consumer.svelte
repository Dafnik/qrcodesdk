<script lang="ts">
  import {VERSION} from 'svelte/compiler';

  import {
    QRCodeCanvas,
    QRCodeJPEG,
    QRCodePNG,
    QRCodeSVG,
    type QRCodeSVGOptions,
    svgCenterImage,
  } from '@qrcodesdk/svelte';

  const options = {style: {moduleSize: 2, quietZone: 1}};
  const imageOptions = {
    ...options,
    accessibility: {
      alt: 'Framework runtime QR code',
      ariaLabel: 'Framework runtime QR code',
    },
  };
  let styledOptions = $state<QRCodeSVGOptions>({
    ...options,
    centerImage: svgCenterImage(
      `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')}`,
    ),
  });
</script>

<main>
  <p data-testid="framework-version">Svelte {VERSION}</p>
  <section data-testid="qrcode-svg">
    <QRCodeSVG payload="HELLO" {options} />
  </section>
  <section data-testid="qrcode-image">
    <QRCodePNG payload="HELLO" options={imageOptions} />
  </section>
  <section data-testid="qrcode-jpeg">
    <QRCodeJPEG payload="HELLO" options={imageOptions} />
  </section>
  <section data-testid="qrcode-canvas">
    <QRCodeCanvas payload="HELLO" {options} />
  </section>
  <section data-testid="qrcode-reactive-svg">
    <QRCodeSVG payload="REACTIVE" options={styledOptions} />
    <button
      onclick={() => {
        styledOptions = {...styledOptions};
      }}>
      Update options
    </button>
  </section>
</main>
