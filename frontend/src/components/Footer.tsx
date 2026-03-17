import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  {
    title: '서비스',
    links: [
      { label: '지도', to: '/map' },
      { label: '랭킹', to: '/ranking' },
      { label: 'AI 건강 분석', to: '/health' },
    ],
  },
  {
    title: '지원',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: '1:1 문의', to: '/contact' },
      { label: '공지사항', to: '/notice' },
    ],
  },
  {
    title: '법적 고지',
    links: [
      { label: '개인정보처리방침', to: '/privacy' },
      { label: '이용약관', to: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="px-6 md:px-12 py-16"
      style={{
        background: '#111e18',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* 상단 — 로고 + 링크 컬럼들 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {/* 좌측 — 로고 + 설명 */}
          <div className="col-span-1 md:col-span-1">
            <div
              style={{
                fontFamily: 'SchoolSafetyNotification, sans-serif',
                fontSize: '24px',
                color: '#fff',
                marginBottom: '14px',
                letterSpacing: '-0.01em',
              }}
            >
              Day<span style={{ color: '#E8A838' }}>.</span>Poo
            </div>
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.7,
                maxWidth: '220px',
              }}
            >
              당신의 흔적이 건강이 됩니다.<br />
              세상에 없던 배변 건강 지도.
            </p>
          </div>

          {/* 우측 — 링크 컬럼들 */}
          {FOOTER_LINKS.map(col => (
            <div key={col.title}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.1em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                {col.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#E8A838')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 — 카피라이트 */}
        <div className="pt-7 flex items-center justify-between flex-wrap gap-4">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
            © 2026 day.poo. All rights reserved.
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
            Made with 💩 in Seoul
          </p>
        </div>
      </div>
    </footer>
  );
}
