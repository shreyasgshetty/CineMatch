import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
export default function OnboardingMovies() {
  const navigate = useNavigate();
  return (
    <OnboardingLayout step={2} title="Rate Movies You've Seen" subtitle="Help us understand your taste — implemented in Phase 6"
      onNext={() => navigate('/onboarding/genres')} canProceed={true} nextLabel="Skip for now →">
      <p style={{ color: 'var(--color-text-muted)' }}>Movie rating cards will appear here once TMDB data is ingested (Phase 6).</p>
    </OnboardingLayout>
  );
}
