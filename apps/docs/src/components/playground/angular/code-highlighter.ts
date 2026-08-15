import angularTs from '@shikijs/langs/angular-ts';
import tsx from '@shikijs/langs/tsx';
import vue from '@shikijs/langs/vue';
import githubDark from '@shikijs/themes/github-dark';
import githubLight from '@shikijs/themes/github-light';
import {createHighlighterCoreSync} from 'shiki/core';
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript';

export function createCodeHighlighter() {
  return createHighlighterCoreSync({
    langs: [angularTs, tsx, vue],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  });
}
