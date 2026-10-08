import React from 'react';
import { Sprout, TreePine, Wheat, Flower2 } from 'lucide-react';

export type FarmLogoId = 'sprout' | 'tree' | 'wheat' | 'flower';

export interface FarmLogoOption {
  id: FarmLogoId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export const FARM_LOGOS: FarmLogoOption[] = [
  { id: 'sprout', label: 'Green Sprout', icon: Sprout, accentColor: 'text-emerald-500' },
  { id: 'tree', label: 'Field Tree', icon: TreePine, accentColor: 'text-emerald-600' },
  { id: 'wheat', label: 'Golden Wheat', icon: Wheat, accentColor: 'text-amber-500' },
  { id: 'flower', label: 'Crop Bloom', icon: Flower2, accentColor: 'text-rose-500' },
];

export const FarmBadgeLogo: React.FC<{
  logoId?: string;
  className?: string;
}> = ({ logoId = 'sprout', className = 'w-5 h-5' }) => {
  switch (logoId) {
    case 'tree':
      return <TreePine className={className} />;
    case 'wheat':
      return <Wheat className={className} />;
    case 'flower':
      return <Flower2 className={className} />;
    case 'sprout':
    default:
      return <Sprout className={className} />;
  }
};
