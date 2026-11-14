import {
  COMBINATION_SETS,
  type CombinationSet,
  DEFAULT_COMBINATION_FILTER,
  combinationFixtures,
} from './combinations';
import {type DevFixture, FIXTURE_CATEGORIES} from './fixture-catalog';

const catalogFixtures = new Map(
  FIXTURE_CATEGORIES.flatMap(({fixtures}) => fixtures.map((fixture) => [fixture.id, fixture])),
);
const combinationSets = new Map<CombinationSet, ReadonlyMap<string, DevFixture>>();

/**
 * Finds a fixture by id, for the decode workers: fixtures hold functions, such as style shapes,
 * which cannot be posted to a worker. Each combination set is indexed on first use.
 */
export function findDevFixture(id: string): DevFixture | undefined {
  const fixture = catalogFixtures.get(id);
  if (fixture) return fixture;

  const set = COMBINATION_SETS.find((candidate) =>
    id.startsWith(`all-combinations/${candidate.id}/`),
  )?.id;
  if (!set) return undefined;
  let fixtures = combinationSets.get(set);
  if (!fixtures) {
    const filter = {...DEFAULT_COMBINATION_FILTER, enabled: true, sets: [set]};
    fixtures = new Map(Array.from(combinationFixtures(filter), (fixture) => [fixture.id, fixture]));
    combinationSets.set(set, fixtures);
  }
  return fixtures.get(id);
}
