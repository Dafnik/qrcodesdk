import angularTs from '@shikijs/langs/angular-ts';
import shell from '@shikijs/langs/shellscript';
import svelte from '@shikijs/langs/svelte';
import tsx from '@shikijs/langs/tsx';
import vue from '@shikijs/langs/vue';
import vitesseBlack from '@shikijs/themes/vitesse-black';
import vitesseLight from '@shikijs/themes/vitesse-light';
import {createHighlighterCoreSync} from 'shiki/core';
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript';

export function createCodeHighlighter() {
  return createHighlighterCoreSync({
    langs: [angularTs, shell, svelte, tsx, vue],
    themes: [vitesseLight, vitesseBlack],
    engine: createJavaScriptRegexEngine(),
  });
}
