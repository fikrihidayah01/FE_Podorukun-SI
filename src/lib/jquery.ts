import $ from 'jquery';

// Polyfill $.now for Summernote compatibility
const anyDollar = $ as any;
if (!anyDollar.now) {
  anyDollar.now = Date.now;
}
if (anyDollar.fn && !anyDollar.fn.now) {
  anyDollar.fn.now = Date.now;
}

if (typeof window !== 'undefined') {
  (window as any).$ = $;
  (window as any).jQuery = $;
  if (!(window as any).$.now) {
    (window as any).$.now = Date.now;
  }
  if (!(window as any).jQuery.now) {
    (window as any).jQuery.now = Date.now;
  }
}

export default $;
