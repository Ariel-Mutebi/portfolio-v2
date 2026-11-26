import type { Cleanup } from './types.ts';

export const watchSize = (node: Element, onResize: () => void): Cleanup => {
  const observer = new ResizeObserver(onResize);
  observer.observe(node);
  return () => observer.disconnect();
};

export const watchVisibility = (
  node: Element,
  onChange: (visible: boolean) => void,
): Cleanup => {
  const observer = new IntersectionObserver((entries) => {
    onChange(entries[entries.length - 1].isIntersecting);
  });
  observer.observe(node);
  return () => observer.disconnect();
};

export const watchMedia = (query: string, onChange: (matches: boolean) => void): Cleanup => {
  const media = window.matchMedia(query);
  const notify = () => onChange(media.matches);

  media.addEventListener('change', notify);
  notify();

  return () => media.removeEventListener('change', notify);
};
