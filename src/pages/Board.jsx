import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremedBoard   from '../components/boards/PremedBoard';
import CSBoard       from '../components/boards/CSBoard';
import BusinessBoard from '../components/boards/BusinessBoard';
import CreativeBoard from '../components/boards/CreativeBoard';
import SeniorBoard   from '../components/boards/SeniorBoard';

export default function Board() {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('breeze_user');
    if (!saved) { navigate('/join'); return; }
    let u;
    try { u = JSON.parse(saved); } catch { localStorage.removeItem('breeze_user'); navigate('/join'); return; }
    setUser(u);

    fetch(`/api/board-data?userId=${u.id}&entityId=${u.entity_id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (error) return <ErrorState error={error} />;
  if (!user)  return null;

  const archetype = user.archetype;

  if (archetype === 'premed')   return <PremedBoard   data={data} loading={loading} />;
  if (archetype === 'cs')       return <CSBoard       data={data} loading={loading} />;
  if (archetype === 'business') return <BusinessBoard data={data} loading={loading} />;
  if (archetype === 'creative') return <CreativeBoard data={data} loading={loading} />;
  if (archetype === 'senior')   return <SeniorBoard   data={data} loading={loading} />;

  // Fallback — shouldn't happen if detect ran
  return <SeniorBoard data={data} loading={loading} />;
}

function ErrorState({ error }) {
  return (
    <div style={{ minHeight: '100vh', background: '#08080F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#E05555', fontSize: 14 }}>
      {error}
    </div>
  );
}
