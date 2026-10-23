import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const luminance = (hex) => {
    const rgb = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255);
    const linear = rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);
let checked = 0;
function check(fg, bg, minimum, label) {
    const actual = ratio(fg, bg);
    assert(actual >= minimum, `${label}: ${fg} on ${bg} = ${actual.toFixed(2)}:1; needs ${minimum}:1`);
    checked++;
}

for (const mode of ['light', 'dark']) {
    const {colors: c, editor} = JSON.parse(readFileSync(new URL(`../themes/${mode}.json`, import.meta.url)));
    for (const fg of ['primary', 'secondary', 'muted'])
        for (const bg of [c.bg.base, c.bg.elevated, c.bg.overlay, c.surface.secondary])
            check(c.text[fg], bg, 4.5, `${mode} text.${fg}`);
    for (const bg of [c.bg.tooltip, c.surface.tertiary])
        check(c.text.primary, bg, 4.5, `${mode} primary text`);
    for (const bg of [c.bg.base, c.bg.elevated, c.surface.secondary])
        check(c.text.accent, bg, 4.5, `${mode} accent text`);
    check(c.text.inverse, c.accent.primary, 4.5, `${mode} button label`);
    for (const [name, value] of Object.entries(c.accent).filter(([name]) => name !== 'primary')) {
        const label = luminance(value) > 0.179 ? '#000000' : '#ffffff';
        check(label, value, 4.5, `${mode} label on ${name}`);
        for (const bg of [c.bg.base, c.bg.elevated])
            check(value, bg, 4.5, `${mode} status ${name}`);
    }
    for (const [name, fg] of Object.entries(c.semantic))
        for (const bg of [c.bg.base, c.bg.elevated])
            check(fg, bg, 4.5, `${mode} semantic.${name}`);
    for (const bg of [c.bg.base, c.bg.elevated, c.bg.input])
        check(c.border.focus, bg, 3, `${mode} focus`);
    const canvas = editor.colors['editor.background'];
    check(editor.colors['editor.foreground'], canvas, 4.5, `${mode} editor text`);
    for (const rule of editor.rules)
        check(rule.foreground, canvas, 4.5, `${mode} SQL ${rule.token}`);
}
console.log(`Passed ${checked} contrast checks across Webdock Light and Dark.`);
