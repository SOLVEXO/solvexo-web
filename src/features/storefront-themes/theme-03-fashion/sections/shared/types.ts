import type { Section, Block } from '@/api/services/storefrontTypes';
import type { FashionColors } from '../../theme.config';

export interface SharedSectionProps { section: Section; blocks: Block[]; colors: FashionColors }
