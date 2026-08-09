import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
export default function OnboardingActors() {
  const navigate = useNavigate();
  return (
    <OnboardingLayout step={4} title="Favourite Actors" subtitle="Actor preference UI — implemented in Phase 7"
      onBack={() => navigate('/onboarding/genres')}
      onNext={() => navigate('/onboarding/directors')} canProceed={true} nextLabel="Skip for now →">
      <p style={{ color: 'var(--color-text-muted)' }}>Actor cards will appear here (Phase 7).</p>
    </OnboardingLayout>
  );
}
