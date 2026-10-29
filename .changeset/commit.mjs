export default {
  getVersionMessage(releasePlan) {
    const releases = releasePlan.releases.filter((release) => release.type !== 'none');
    const versions = new Set(releases.map((release) => release.newVersion));

    if (versions.size === 1) {
      return `chore: release ${[...versions][0]}`;
    }

    return `chore: release\n\n${releases.map((release) => `- ${release.name}@${release.newVersion}`).join('\n')}`;
  },
};
