import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ArrowRight } from 'lucide-react';
// Select imported for future use

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
};

function SolvexoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const TABS = ['All', 'Physical', 'Digital', 'Education', 'Art & Design', 'Templates', 'Music'];

const PRODUCTS = [
  { id: 1, name: 'Watercolor Botanical Prints', seller: 'ArtByMia', price: '$24.00', tag: 'Digital', tagColor: 'blue' as const, rating: '4.9', reviews: 312, img: '🌿' },
  { id: 2, name: 'Grade 5 Math Bundle – Full Year', seller: 'TeachersPro', price: '$49.00', tag: 'Education', tagColor: 'green' as const, rating: '5.0', reviews: 847, img: '📚' },
  { id: 3, name: 'Handmade Ceramic Mug Set', seller: 'KiloKraft', price: '$58.00', tag: 'Physical', tagColor: 'orange' as const, rating: '4.8', reviews: 203, img: '☕' },
  { id: 4, name: 'Brand Identity Figma Kit', seller: 'DesignVault', price: '$39.00', tag: 'Digital', tagColor: 'blue' as const, rating: '4.9', reviews: 519, img: '🎨' },
  { id: 5, name: 'Linen Wall Hanging – Boho', seller: 'ThreadCo', price: '$72.00', tag: 'Physical', tagColor: 'orange' as const, rating: '4.7', reviews: 144, img: '🪢' },
  { id: 6, name: 'Lo-Fi Chill Music Pack (25 tracks)', seller: 'BeatsByKai', price: '$19.00', tag: 'Digital', tagColor: 'blue' as const, rating: '4.8', reviews: 290, img: '🎵' },
];

const PRICE_FILTERS = ['Under $10', '$10–$50', '$50–$100', '$100+'];
const TYPE_FILTERS = ['Physical', 'Digital', 'Education'];
const RATING_FILTERS = ['4★ & up', '3★ & up'];

export function Marketplace() {
  const navigate = useNavigate();
  usePageTitle('Marketplace');
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        gap: 16, paddingLeft: 40, paddingRight: 40,
      }}>
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
          <span style={{ color: C.bone, marginLeft: 4, marginRight: 4 }}>|</span>
          <span style={{ fontSize: 13, color: C.slate }}>Marketplace</span>
        </div>

        {/* Center: search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <input
            placeholder="🔍 Search marketplace..."
            style={{
              width: '100%', maxWidth: 440,
              padding: '8px 14px', borderRadius: 8,
              border: `1px solid ${C.bone}`, backgroundColor: C.cream,
              fontSize: 13, color: C.charcoal, outline: 'none',
            }}
          />
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Home</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Sell on Solvexo</Button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: C.orange, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
          }}>
            🛒
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(120deg, #FBECE4, #FFF5EE)',
        padding: '36px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700,
            color: C.carbon, marginBottom: 8,
          }}>
            Discover Something Made with Love
          </h1>
          <p style={{ fontSize: 14, color: C.slate, marginBottom: 20 }}>
            Shop unique products from independent sellers, creators, and educators.
          </p>
          <Button variant="primary" size="md" onClick={() => {}}>Shop Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Button>
        </div>
        <div style={{ fontSize: 80 }}>🛍️</div>
      </div>

      {/* Category tabs */}
      <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.bone}` }}>
        <div style={{ display: 'flex', paddingLeft: 40, paddingRight: 40 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderBottom: `2px solid ${activeTab === tab ? C.orange : 'transparent'}`,
                backgroundColor: activeTab === tab ? C.paleOrange : 'transparent',
                color: activeTab === tab ? C.deepOrange : C.slate,
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 13, cursor: 'pointer',
                outline: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', gap: 24, padding: '24px 40px' }}>
        {/* Filter sidebar */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.carbon, marginBottom: 14 }}>Filters</div>

          {/* Price Range */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Price Range
            </div>
            {PRICE_FILTERS.map((label) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{
                    width: 14, height: 14, borderRadius: 2,
                    border: `1px solid ${C.bone}`, accentColor: C.orange,
                  }}
                />
                <span style={{ fontSize: 12, color: C.charcoal }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Product Type */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Product Type
            </div>
            {TYPE_FILTERS.map((label) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{
                    width: 14, height: 14, borderRadius: 2,
                    border: `1px solid ${C.bone}`, accentColor: C.orange,
                  }}
                />
                <span style={{ fontSize: 12, color: C.charcoal }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Rating */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Rating
            </div>
            {RATING_FILTERS.map((label) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{
                    width: 14, height: 14, borderRadius: 2,
                    border: `1px solid ${C.bone}`, accentColor: C.orange,
                  }}
                />
                <span style={{ fontSize: 12, color: C.charcoal }}>{label}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Products area */}
        <div style={{ flex: 1 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: C.slate }}>Showing 6 results</span>
            <select
              style={{
                padding: '6px 10px', borderRadius: 8,
                border: `1px solid ${C.bone}`, backgroundColor: C.white,
                fontSize: 13, color: C.charcoal, outline: 'none', cursor: 'pointer',
              }}
            >
              <option>Featured</option>
              <option>Price: Low–High</option>
              <option>Best Rated</option>
              <option>Newest</option>
            </select>
          </div>

          {/* Product grid 3-col */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {PRODUCTS.map((p) => (
              <Card key={p.id} padding="none" hover onClick={() => navigate('/marketplace/1')}>
                {/* Image area */}
                <div style={{
                  height: 160, backgroundColor: C.paleOrange,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 60,
                  borderRadius: '12px 12px 0 0',
                }}>
                  {p.img}
                </div>
                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.carbon, marginBottom: 4, lineHeight: 1.3 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.slate, marginBottom: 6 }}>by {p.seller}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Badge color={p.tagColor}>{p.tag}</Badge>
                    <span style={{ fontSize: 11, color: C.charcoal }}>
                      ⭐ {p.rating} ({p.reviews})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>{p.price}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
