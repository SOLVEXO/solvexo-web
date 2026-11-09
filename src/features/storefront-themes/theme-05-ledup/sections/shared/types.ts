import type { Section, Block } from '@/api/services/storefrontTypes';
import type { BaseColors } from '../../theme.base';

export interface SharedSectionProps { section: Section; blocks: Block[]; colors: BaseColors }
