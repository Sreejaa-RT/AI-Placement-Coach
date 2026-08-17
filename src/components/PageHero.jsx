import React from 'react';

export default function PageHero({ badge, title, subtitle, supportingLine }) {
  return (
    <div style={{
      padding: '40px 40px 32px 40px',
      background: 'linear-gradient(135deg, #005947 0%, #00473a 50%, #18A957 100%)',
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: 0,
      borderRadius: '16px 16px 0 0'
    }}>
      {/* Pill Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 14px',
        borderRadius: '9999px',
        background: 'rgba(255, 255, 255, 0.12)',
        color: '#2FBF71',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {badge}
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '30px',
        fontWeight: '800',
        marginBottom: '8px',
        color: '#FFFFFF',
        letterSpacing: '-0.5px'
      }}>
        {title}
      </h2>

      {/* Subtitle */}
      <p style={{
        color: '#E6F4ED',
        fontSize: '14.5px',
        fontWeight: '500',
        margin: 0,
        lineHeight: '1.5'
      }}>
        {subtitle}
      </p>

      {/* Motivational/Supporting Line */}
      {supportingLine && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#B2D1C1',
          fontSize: '12px',
          fontWeight: '500',
          marginTop: '12px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ color: '#2FBF71' }}>
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
          </svg>
          <span>{supportingLine}</span>
        </div>
      )}
    </div>
  );
}
