import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
export default function OnboardingGenres() {
  const navigate = useNavigate();
  return (
    <OnboardingLayout step={3} title="What Genres Do You Love?" subtitle="Genre preference UI — implemented in Phase 7"
      onBack={() => navigate('/onboarding/movies')}
      onNext={() => navigate('/onboarding/actors')} canProceed={true} nextLabel="Skip for now →">
      <p style={{ color: 'var(--color-text-muted)' }}>Genre selection cards will appear here (Phase 7).</p>
    </OnboardingLayout>
  );
}
