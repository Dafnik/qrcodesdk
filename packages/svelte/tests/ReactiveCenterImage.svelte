<script lang="ts">
  import {QRCodeSVG, type QRCodeSVGOptions, svgCenterImage} from '../src/lib/index.js';

  let options = $state<QRCodeSVGOptions>({
    centerImage: svgCenterImage('data:image/png;base64,a'),
  });
</script>

<QRCodeSVG payload="reactive image" {options} />
<button
  onclick={() => {
    options = {...options, centerImage: svgCenterImage('data:image/png;base64,b')};
  }}>
  Change image
</button>
