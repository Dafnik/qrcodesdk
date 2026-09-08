import angularTs from '@shikijs/langs/angular-ts';
import svelte from '@shikijs/langs/svelte';
import tsx from '@shikijs/langs/tsx';
import vue from '@shikijs/langs/vue';
import githubLight from '@shikijs/themes/github-light';
import poimandres from '@shikijs/themes/poimandres';
import {createHighlighterCoreSync} from 'shiki/core';
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript';

export function createCodeHighlighter() {
  return createHighlighterCoreSync({
    langs: [angularTs, svelte, tsx, vue],
    themes: [githubLight, poimandres],
    engine: createJavaScriptRegexEngine(),
  });
}
