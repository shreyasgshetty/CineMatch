import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
export default function OnboardingDirectors() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const handleFinish = async () => {
    try {
      const res = await onboardingApi.saveDirectors({ directors: [] });
      if (res.data.user) updateUser(res.data.user);
      navigate('/home');
    } catch { navigate('/home'); }
  };
  return (
    <OnboardingLayout step={5} title="Favourite Directors" subtitle="Director preference UI — implemented in Phase 7"
      onBack={() => navigate('/onboarding/actors')}
      onNext={handleFinish} canProceed={true} nextLabel="🎬 Start Watching!">
      <p style={{ color: 'var(--color-text-muted)' }}>Director cards will appear here (Phase 7). Click the button to complete onboarding now.</p>
    </OnboardingLayout>
  );
}
