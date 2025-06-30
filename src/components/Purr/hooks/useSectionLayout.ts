import { useCallback, useRef, useState } from 'react';

export const useSectionLayout = () => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [sectionOffsets, setSectionOffsets] = useState<number[]>([]);

  const setSectionRef = (index: number) => (ref: HTMLElement | null) => {
    sectionRefs.current[index] = ref;
  };

  const calculateOffsets = useCallback(() => {
    let cumulativeHeight = 0;
    const offsets: number[] = [];
    
    sectionRefs.current.forEach((ref, index) => {
      offsets[index] = cumulativeHeight;
      
      if (ref) {
        // Get the actual height of the content, ensuring minimum of viewport height
        const rect = ref.getBoundingClientRect();
        const actualHeight = Math.max(rect.height, window.innerHeight);
        cumulativeHeight += actualHeight;
      } else {
        // Fallback to viewport height if ref not available
        cumulativeHeight += window.innerHeight;
      }
    });
    
    setSectionOffsets(offsets);
  }, []);

  return {
    setSectionRef,
    sectionOffsets,
    recalculate: calculateOffsets
  };
};