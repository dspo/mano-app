import React, { ReactElement, forwardRef } from "react";
import useResizeObserver from "use-resize-observer";

// 内联实现mergeRefs功能，避免导入错误
function mergeRefs<T>(...refs: (React.Ref<T> | undefined | null)[]) {
  const filteredRefs = refs.filter(Boolean);
  if (filteredRefs.length === 0) return null;
  if (filteredRefs.length === 1) return filteredRefs[0];
  
  return (instance: T) => {
    for (const ref of filteredRefs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = instance;
      }
    }
  };
}

type Props = {
  children: (dimens: { width: number; height: number }) => ReactElement;
};

const style = {
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
};

export const FillFlexParent = forwardRef(function FillFlexParent(
  props: Props,
  forwardRef: React.Ref<HTMLDivElement>
) {
  const { ref, width, height } = useResizeObserver();
  return (
    <div style={style} ref={mergeRefs(ref as React.Ref<HTMLDivElement>, forwardRef)}>
      {width && height ? props.children({ width, height }) : null}
    </div>
  );
});