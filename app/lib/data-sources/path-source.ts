import pathData from '../../../data/me-path.json';
import type { PathData } from '../../types/path';

export function getPathData(): PathData {
  return pathData as PathData;
}
