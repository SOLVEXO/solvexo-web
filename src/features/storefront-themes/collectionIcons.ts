import {
  Baby, BookOpen, Briefcase, Camera, Car, Coffee, Dumbbell, Flower2, Gamepad2, Gem, Gift, GraduationCap, Heart, Home, Laptop,
  Leaf, Music, Package, Palette, Pencil, School, Shirt, ShoppingBag, Smartphone, Sparkles, Star, Tag, Utensils, Watch, Wrench,
  type LucideIcon,
} from 'lucide-react';

/** Icons a seller can pick for a Collection List tile. The stored value is the key; no key = no icon. */
export const COLLECTION_ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  book: { Icon: BookOpen, label: 'Book' },
  school: { Icon: School, label: 'School' },
  graduation: { Icon: GraduationCap, label: 'Graduation' },
  pencil: { Icon: Pencil, label: 'Pencil / stationery' },
  palette: { Icon: Palette, label: 'Art / colours' },
  baby: { Icon: Baby, label: 'Baby / kids' },
  shirt: { Icon: Shirt, label: 'Clothing' },
  watch: { Icon: Watch, label: 'Watch' },
  gem: { Icon: Gem, label: 'Jewellery' },
  bag: { Icon: ShoppingBag, label: 'Bag / shopping' },
  tag: { Icon: Tag, label: 'Tag / sale' },
  gift: { Icon: Gift, label: 'Gift' },
  heart: { Icon: Heart, label: 'Heart' },
  star: { Icon: Star, label: 'Star' },
  sparkles: { Icon: Sparkles, label: 'Sparkles' },
  leaf: { Icon: Leaf, label: 'Natural / eco' },
  flower: { Icon: Flower2, label: 'Flower / beauty' },
  home: { Icon: Home, label: 'Home' },
  utensils: { Icon: Utensils, label: 'Food / kitchen' },
  coffee: { Icon: Coffee, label: 'Coffee / drinks' },
  laptop: { Icon: Laptop, label: 'Computers' },
  phone: { Icon: Smartphone, label: 'Phones' },
  camera: { Icon: Camera, label: 'Camera' },
  gamepad: { Icon: Gamepad2, label: 'Games / toys' },
  music: { Icon: Music, label: 'Music' },
  fitness: { Icon: Dumbbell, label: 'Fitness' },
  car: { Icon: Car, label: 'Auto' },
  tools: { Icon: Wrench, label: 'Tools' },
  briefcase: { Icon: Briefcase, label: 'Office / business' },
  package: { Icon: Package, label: 'Package' },
};

export const COLLECTION_ICON_OPTIONS = [
  { value: '', label: 'No icon' },
  ...Object.entries(COLLECTION_ICONS).map(([value, { label }]) => ({ value, label })),
];

/** The icon for a stored key, or null when none is set / the key is unknown. */
export function collectionIcon(name: unknown): LucideIcon | null {
  return COLLECTION_ICONS[typeof name === 'string' ? name : '']?.Icon ?? null;
}
