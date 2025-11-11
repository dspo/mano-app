import React from 'react';

/**
 * Merges multiple refs into a single ref callback.
 * If only one ref is provided, it will be returned as is.
 * @param refs Array of refs to merge
 */
const mergeRefs = (...refs: (React.Ref<any> | undefined | null)[]) => {
  const filteredRefs = refs.filter(Boolean);
  if (filteredRefs.length === 0) return null;
  if (filteredRefs.length === 1) return filteredRefs[0];
  
  return (instance: any) => {
    for (const ref of filteredRefs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref != null) {
        (ref as React.MutableRefObject<any>).current = instance;
      }
    }
  };
};

export default mergeRefs;