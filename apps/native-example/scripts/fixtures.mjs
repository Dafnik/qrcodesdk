import {readFile} from 'node:fs/promises';

export const fixtures = JSON.parse(
  await readFile(new URL('../fixtures.json', import.meta.url), 'utf8'),
);
export const screenshotCases = [
  ...fixtures.map((fixture) => ({...fixture, screenshot: fixture.id})),
  {
    ...fixtures.find((fixture) => fixture.id === 'png'),
    screenshot: 'png-updated',
    payload: fixtures.find((fixture) => fixture.id === 'png').payload + '?updated=1',
  },
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
      '- scrollUntilVisible:',
      `    element: {id: "select-${fixture.id}"}`,
      '    direction: UP',
      `- tapOn: {id: "select-${fixture.id}"}`,
      '- assertVisible:',
      `    id: fixture-name`,
      `    text: ${JSON.stringify(fixture.label)}`,
      '- waitForAnimationToEnd',
      `- takeScreenshot: ${fixture.id}`,
    );
    if (fixture.format !== 'svg') {
      lines.push(
        '- scrollUntilVisible:',
        '    element: {id: export-image}',
        '    direction: DOWN',
        '- tapOn: {id: export-image}',
        '- scrollUntilVisible:',
        '    element: {id: export-success}',
        '    direction: DOWN',
        '- assertVisible: {id: export-success}',
      );
    }
  }
  lines.push(
    '- scrollUntilVisible:',
    '    element: {id: select-png}',
    '    direction: UP',
    '- tapOn: {id: select-png}',
    '- scrollUntilVisible:',
    '    element: {id: update-payload}',
    '    direction: DOWN',
    '- tapOn: {id: update-payload}',
    '- assertVisible:',
    '    id: fixture-name',
    '    text: PNG updated',
    '- scrollUntilVisible:',
    '    element: {id: select-png}',
    '    direction: UP',
    '- waitForAnimationToEnd',
    '- takeScreenshot: png-updated',
  );
  return lines.join('\n') + '\n';
}
