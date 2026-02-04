import profileData from '../../../data/profile.json';
import type { ProfileData } from '../../types/profile';

export function getProfileData(): ProfileData {
  return profileData as ProfileData;
}
