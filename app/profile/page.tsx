import { ProfileDashboard } from '../components/profile/profile-dashboard';
import { getProfileData } from '../lib/data-sources/profile-source';

export default function ProfilePage() {
  const profileData = getProfileData();

  return <ProfileDashboard initialData={profileData} />;
}
