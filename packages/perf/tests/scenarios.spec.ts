import {expect, test} from 'vitest';

import {FEATURES, getCodeArea} from '../src/areas.ts';
import {SIZE_SCENARIOS, validateScenarios} from '../src/size/scenarios.ts';

test('size scenarios have unique ids, known baselines, features, and code areas', () => {
  expect(() => validateScenarios(SIZE_SCENARIOS)).not.toThrow();
  for (const scenario of SIZE_SCENARIOS) {
    for (const feature of scenario.features) expect(Object.keys(FEATURES)).toContain(feature);
    for (const area of scenario.expect ?? []) expect(getCodeArea(area).optional).toBe(true);
  }
});

test('duplicate scenario ids are rejected', () => {
  const [first] = SIZE_SCENARIOS;
  expect(() => validateScenarios([first!, first!])).toThrow('Duplicate size scenario');
});
