/* =====================================================================
   TEXT ANIMATION
   Wraps every character of the marked headings in its own <span> and
   staggers a floating animation across them, so the letters appear to
   move in a gentle wave. Preserves any nested formatting (like the
   gradient "accent" span) by walking the DOM recursively.
   ===================================================================== */

(function () {

  /* Recursively wrap text nodes inside `node`, giving each character
     its own span with an increasing animation-delay for the wave effect. */
  function wrapLetters(node, counter) {
    Array.from(node.childNodes).forEach(child => {

      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();

        for (const char of child.textContent) {
          const span = document.createElement('span');
          span.className = 'letter-float';
          span.style.animationDelay = (counter.i * 0.045) + 's';
          span.textContent = char === ' ' ? '\u00A0' : char;
          fragment.appendChild(span);
          counter.i++;
        }
        child.replaceWith(fragment);

      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapLetters(child, counter);
      }
    });
  }

  function animateAllHeadings() {
    document.querySelectorAll('[data-animate-text]').forEach(el => {
      wrapLetters(el, { i: 0 });
    });
  }

  document.addEventListener('DOMContentLoaded', animateAllHeadings);
})();