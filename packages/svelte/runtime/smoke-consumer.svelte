<script lang="ts">
  import {VERSION} from 'svelte/compiler';

  import {QRCodeCanvas, QRCodeImage, QRCodeSVG} from '@qrcodesdk/svelte';

  const options = {style: {moduleSize: 2, quietZone: 1}};
  const imageOptions = {
    ...options,
    accessibility: {
      alt: 'Framework runtime QR code',
      ariaLabel: 'Framework runtime QR code',
    },
  };
</script>

<main>
  <p data-testid="framework-version">Svelte {VERSION}</p>
  <section data-testid="qrcode-svg">
    <QRCodeSVG data="HELLO" {options} />
  </section>
  <section data-testid="qrcode-image">
    <QRCodeImage data="HELLO" options={imageOptions} />
  </section>
  <section data-testid="qrcode-canvas">
    <QRCodeCanvas data="HELLO" {options} />
  </section>
</main>
