import type { Case, Location } from '@/contracts';

export interface CityMapProps {
  cases?: Case[];
  selected?: string;
  onSelect?: (id: string) => void;
  value?: Location;
  onChange?: (location: Location) => void;
  compact?: boolean;
}
