const path = require('node:path');
const Metro = require('metro');

// Usage: node bundle.cjs <entry> <output> <platform>
const [entry, out, platform] = process.argv.slice(2);

Metro.loadConfig({config: path.join(__dirname, 'metro.config.cjs')})
  .then((config) => Metro.runBuild(config, {entry, out, platform, dev: false, minify: false}))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
