import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="polarnav-footer"
      className="mt-8 pt-5 pb-6 border-t border-[rgba(165,177,224,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#666b86] uppercase tracking-[1.5px] font-mono"
    >
      <div className="flex items-center gap-2 text-center sm:text-left">
        <span className="w-1.5 h-1.5 rounded-full bg-[#45e0d0] opacity-70" />
        <span>POLARNAV ANTARCTIC NAVIGATION PROTOTYPE · ILLUSTRATIVE DATASETS</span>
      </div>

      <div className="flex items-center gap-4">
        <span>BUILT FOR RESEARCH CONCEPT DEMONSTRATION</span>
        <span className="text-[#8b7cff] font-bold">v1.4-POLAR</span>
      </div>
    </footer>
  );
};
