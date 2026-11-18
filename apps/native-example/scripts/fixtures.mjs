import {readFile} from 'node:fs/promises';

const {cases, update} = JSON.parse(
  await readFile(new URL('../fixtures.json', import.meta.url), 'utf8'),
);

/** Every case the app can render, in the order of its controls. */
export const fixtures = cases;
const updated = fixtures.find((fixture) => fixture.id === update.case);
/** The case whose payload the flow changes after its first render. */
export const updatedFixture = {...updated, payload: updated.payload + update.suffix};

const isImage = (fixture) => fixture.format !== 'svg';

/** Every screenshot the flow takes, in order, with the payload it must decode to. */
export const screenshotCases = [
  ...fixtures.flatMap((fixture) => [
    {...fixture, screenshot: fixture.id},
    // Image components also show the bytes returned by toDataURL(), so the export decodes too.
    ...(isImage(fixture) ? [{...fixture, screenshot: `${fixture.id}-export`}] : []),
  ]),
  {...updatedFixture, screenshot: `${updatedFixture.id}-updated`},
];

const scrollTo = (id, direction) => [
  '- scrollUntilVisible:',
  `    element: {id: ${JSON.stringify(id)}}`,
  `    direction: ${direction}`,
];
const screenshot = (caption, name) => [
  '- assertVisible:',
  '    id: fixture-name',
  `    text: ${JSON.stringify(caption)}`,
  '- waitForAnimationToEnd',
  `- takeScreenshot: ${name}`,
];

/** Generate the Maestro flow from the same fixture list the app renders. */
export function createFlow() {
  const lines = [
    'appId: dev.qrcodesdk.nativeexample',
    '---',
    '- launchApp:',
    '    clearState: true',
  ];
  for (const fixture of fixtures) {
    lines.push(
      ...scrollTo(`select-${fixture.id}`, 'UP'),
      `- tapOn: {id: ${JSON.stringify(`select-${fixture.id}`)}}`,
      ...screenshot(fixture.label, fixture.id),
    );
    if (isImage(fixture)) {
      lines.push(
        ...scrollTo('export-image', 'DOWN'),
        '- tapOn: {id: export-image}',
        // The preview replaces the live component with the exported data URL.
        ...scrollTo('exported-image', 'UP'),
        ...screenshot(`${fixture.label} exported`, `${fixture.id}-export`),
      );
    }
  }
  lines.push(
    ...scrollTo(`select-${updatedFixture.id}`, 'UP'),
    `- tapOn: {id: ${JSON.stringify(`select-${updatedFixture.id}`)}}`,
    ...scrollTo('update-payload', 'DOWN'),
    '- tapOn: {id: update-payload}',
    ...scrollTo(`select-${updatedFixture.id}`, 'UP'),
    ...screenshot(`${updatedFixture.label} updated`, `${updatedFixture.id}-updated`),
  );
  return lines.join('\n') + '\n';
}
