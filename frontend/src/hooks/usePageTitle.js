import { useEffect } from 'react';

const BASE_TITLE = 'Sellify';

export default function usePageTitle(title, options = {}) {
  const { fullTitle = null } = options;

  useEffect(() => {
    const nextTitle = fullTitle ?? (title ? `${title} | ${BASE_TITLE}` : BASE_TITLE);
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }
    return () => {
      if (options.resetOnUnmount) {
        document.title = BASE_TITLE;
      }
    };
  }, [title, fullTitle, options.resetOnUnmount]);
}
