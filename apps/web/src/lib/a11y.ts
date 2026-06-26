import { useEffect } from 'react';

const TITLE_SUFFIX = 'SourceSage';

/**
 * Sets `document.title` for the current view (WCAG 2.4.2 Page Titled). The SPA
 * shell ships a static title, so each route announces its own. The previous
 * title is restored on unmount.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · ${TITLE_SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
