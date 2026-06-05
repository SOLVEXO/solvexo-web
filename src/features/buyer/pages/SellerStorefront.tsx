import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

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

const STORE_TABS = ['All Products', 'Math', 'Reading', 'Science', 'Social Studies', 'Bundles'];

const PRODUCTS = [
  { name: 'Grade 5 Math Bundle', price: '$49', img: '📚', rating: '5.0', sold: '847sold' },
  { name: 'Fractions Mastery Kit', price: '$18', img: '➗', rating: '4.9', sold: '623sold' },
  { name: 'Reading Comprehension Pack', price: '$22', img: '📖', rating: '4.9', sold: '501sold' },
  { name: 'Science Lab Worksheets', price: '$15', img: '🔬', rating: '4.8', sold: '389sold' },
  { name: 'State Capitals Flash Cards', price: '$9', img: '🗺️', rating: '4.7', sold: '302sold' },
  { name: 'Creative Writing Prompts', price: '$12', img: '✏️', rating: '4.8', sold: '278sold' },
  { name: 'Year-End Test Prep Bundle', price: '$35', img: '📝', rating: '5.0', sold: '244sold' },
  { name: 'Geometry Exploration Kit', price: '$21', img: '📐', rating: '4.9', sold: '198sold' },
];

export function SellerStorefront() {
  const navigate = useNavigate();
  usePageTitle('Storefront');
  const [activeTab, setActiveTab] = useState('All Products');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.cream }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: C.white, borderBottom: `1px solid ${C.bone}`,
        height: 60, display: 'flex', alignItems: 'center',
        gap: 16, paddingLeft: 40, paddingRight: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SolvexoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.carbon }}>Solvex</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.orange }}>o</span>
          <span style={{ color: C.bone, marginLeft: 4, marginRight: 4 }}>|</span>
          <span style={{ fontSize: 13, color: C.slate }}>Marketplace</span>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>← Marketplace</Button>
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

      {/* Store banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1A4A2C, #2D7A4E)',
        padding: '36px 40px',
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Store avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          backgroundColor: C.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, flexShrink: 0,
        }}>
          📚
        </div>

        {/* Store info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.white, marginBottom: 6 }}>TeachersPro</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
            Veteran educator • 2,140 sales • ⭐ 5.0 • Member since 2021
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge color="green">✓ Top Seller</Badge>
            <Badge color="blue">Education Specialist</Badge>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            backgroundColor: 'transparent', color: C.white,
            border: `1px solid ${C.white}`, cursor: 'pointer',
          }}>
            Follow Store
          </button>
          <Button variant="primary" size="sm">Message Seller</Button>
        </div>
      </div>

      {/* Store tabs */}
      <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.bone}` }}>
        <div style={{ display: 'flex', paddingLeft: 40, paddingRight: 40 }}>
          {STORE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                border: 'none', outline: 'none',
                borderBottom: `2px solid ${activeTab === tab ? C.orange : 'transparent'}`,
                backgroundColor: activeTab === tab ? C.paleOrange : 'transparent',
                color: activeTab === tab ? C.deepOrange : C.slate,
                fontWeight: activeTab === tab ? 700 : 400,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.carbon }}>47 Products</span>
          <select style={{
            padding: '6px 10px', borderRadius: 8,
            border: `1px solid ${C.bone}`, backgroundColor: C.white,
            fontSize: 13, color: C.charcoal, outline: 'none', cursor: 'pointer',
          }}>
            <option>Best Selling</option>
            <option>Newest</option>
            <option>Price: Low–High</option>
            <option>Best Rated</option>
          </select>
        </div>

        {/* 4-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {PRODUCTS.map((p) => (
            <Card key={p.name} padding="none" hover onClick={() => navigate('/marketplace/1')}>
              {/* Image area */}
              <div style={{
                height: 130, backgroundColor: C.successBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, borderRadius: '12px 12px 0 0',
              }}>
                {p.img}
              </div>
              {/* Content */}
              <div style={{ padding: 14 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: C.carbon,
                  lineHeight: 1.4, marginBottom: 4,
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginBottom: 8 }}>
                  ⭐ {p.rating} • {p.sold}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.carbon }}>{p.price}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
