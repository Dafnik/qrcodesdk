export async function createCodeHighlighter() {
  const [
    {createHighlighterCore},
    {createJavaScriptRegexEngine},
    {default: tsx},
    {default: angularHtml},
    {default: angularTs},
    {default: json},
    {default: typescript},
    {default: githubLight},
    {default: githubDark},
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('@shikijs/langs/tsx'),
    import('@shikijs/langs/angular-html'),
    import('@shikijs/langs/angular-ts'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/themes/github-light'),
    import('@shikijs/themes/github-dark'),
  ]);

  return createHighlighterCore({
    langs: [angularHtml, angularTs, json, typescript, tsx],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  });
}
