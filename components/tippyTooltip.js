import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export default function createTippyTooltip(target, content) {
    tippy(target, {
        content: content,
        theme: 'light-border',
        animation: 'fade',
        delay: [100, 100],
        placement: 'top',
        arrow: true,
        trigger: 'click',
    });
}