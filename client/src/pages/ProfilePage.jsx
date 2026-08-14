import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

function StatCard({ icon, value, label }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        padding: 'var(--space-4)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          fontSize: '1.4rem',
          marginBottom: 6,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: '1.3rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PreferenceBar({ name, value, maxValue }) {
  const percentage =
    maxValue > 0
      ? Math.max(0, (value / maxValue) * 100)
      : 0;

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: '0.82rem',
        }}
      >
        <span
          style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          {name}
        </span>

        <span
          style={{
            color: 'var(--gold)',
            fontSize: '0.72rem',
          }}
        >
          {value.toFixed(2)}
        </span>
      </div>

      <div
        style={{
          height: 6,
          background: 'var(--bg-elevated)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'var(--gold)',
            borderRadius: 20,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function getActivityText(activity) {
  const title = activity.mediaId?.title || 'Unknown title';

  switch (activity.action) {
    case 'rated':
      return `Rated ${title} — ${activity.rating}/5`;

    case 'interested':
      return `Interested in ${title}`;

    case 'not_interested':
      return `Not interested in ${title}`;

    case 'watched':
      return `Watched ${title}`;

    case 'skipped':
      return `Skipped ${title}`;

    default:
      return `Interacted with ${title}`;
  }
}

function getActivityIcon(action) {
  switch (action) {
    case 'rated':
      return '⭐';

    case 'interested':
      return '👍';

    case 'not_interested':
      return '👎';

    case 'watched':
      return '🎬';

    case 'skipped':
      return '⏭️';

    default:
      return '🎥';
  }
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const response = await userApi.getProfile();

        setProfile(response.data);
      } catch (err) {
        console.error('Failed to load profile:', err);

        setError(
          err.response?.data?.message ||
          'Failed to load your profile.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Loading your CineMatch profile...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{
          padding: 'var(--space-8) 0',
          color: '#ef4444',
        }}
      >
        {error}
      </div>
    );
  }

  const stats = profile?.stats || {};

  const genreEntries = Object.entries(
    profile?.preferences?.genres || {}
  )
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxGenreWeight =
    genreEntries.length > 0
      ? genreEntries[0][1]
      : 1;

  const languages =
    profile?.preferences?.languages || [];

  const recentActivity =
    profile?.recentActivity || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 'var(--space-8) 0',
      }}
    >
      <div className="container">

        {/* Header */}

        <div
          style={{
            marginBottom: 'var(--space-8)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-gold)',
              }}
            >
              👤
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {profile?.user?.name || user?.name}
              </h1>

              <p
                style={{
                  margin: '4px 0 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                {profile?.user?.email || user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Your CineMatch Journey
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-8)',
          }}
        >
          <StatCard
            icon="🎬"
            value={stats.totalInteractions || 0}
            label="Total Interactions"
          />

          <StatCard
            icon="⭐"
            value={stats.ratedCount || 0}
            label="Movies Rated"
          />

          <StatCard
            icon="👍"
            value={stats.interestedCount || 0}
            label="Interested"
          />

          <StatCard
            icon="👎"
            value={stats.notInterestedCount || 0}
            label="Not Interested"
          />
        </div>

        {/* Preferences */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-8)',
          }}
        >

          {/* Top Genres */}

          <div
            style={{
              padding: 'var(--space-5)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 'var(--space-5)',
                fontFamily: 'var(--font-display)',
              }}
            >
              🎯 Your Taste Profile
            </h2>

            {genreEntries.length > 0 ? (
              genreEntries.map(([genre, value]) => (
                <PreferenceBar
                  key={genre}
                  name={genre}
                  value={value}
                  maxValue={maxGenreWeight}
                />
              ))
            ) : (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                Keep rating movies to build your taste profile.
              </p>
            )}
          </div>

          {/* Languages */}

          <div
            style={{
              padding: 'var(--space-5)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 'var(--space-5)',
                fontFamily: 'var(--font-display)',
              }}
            >
              🌍 Preferred Languages
            </h2>

            {languages.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                {languages.map((language) => (
                  <span
                    key={language}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {language}
                  </span>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No language preferences yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}

        <div
          style={{
            padding: 'var(--space-5)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 'var(--space-5)',
              fontFamily: 'var(--font-display)',
            }}
          >
            🕒 Recent Activity
          </h2>

          {recentActivity.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              {recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    paddingBottom: 'var(--space-3)',
                    borderBottom:
                      '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.1rem',
                    }}
                  >
                    {getActivityIcon(activity.action)}
                  </span>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {getActivityText(activity)}
                    </div>

                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                        marginTop: 3,
                      }}
                    >
                      {activity.timestamp
                        ? new Date(
                          activity.timestamp
                        ).toLocaleDateString()
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              Your movie activity will appear here.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}