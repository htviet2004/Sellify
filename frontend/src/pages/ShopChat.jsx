import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import { buildWsUrl } from '../utils/wsConfig';

export default function ShopChat() {
  const { shopId, buyerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  usePageTitle(buyerId ? `Shop chat với khách #${buyerId}` : 'Chat của shop');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const qs = new URLSearchParams({ token });
    if (buyerId) qs.set('buyer', buyerId);

    const wsUrl = buildWsUrl(`/ws/chat/${shopId}/`, qs);
    if (!wsUrl) {
      console.error('WS error: unable to resolve shop chat endpoint');
      return undefined;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log('WS connected (shop)');
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'history') setMessages(data.messages || []);
        else if (data.type === 'message' && data.message) setMessages(prev => [...prev, data.message]);
      } catch {}
    };
    ws.onclose = (evt) => console.log('WS closed', evt);
    ws.onerror = (e) => console.log('WS error', e);

    return () => ws.close();
  }, [shopId, buyerId, user, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content }));
    setText('');
  };

  if (!user) return null;

  return (
    <div style={{maxWidth:900, margin:'20px auto', background:'#fff', border:'1px solid #eee', borderRadius:8, display:'flex', flexDirection:'column', height:'80vh'}}>
      <div style={{padding:12, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <Link to="/" style={{marginRight:12}}>&larr; Trang chủ</Link>
          <strong>Shop #{shopId} chat với buyer #{buyerId}</strong>
        </div>
      </div>
      <div style={{flex:1, overflowY:'auto', padding:12}}>
        {messages.map(m => (
          <div key={m.id} style={{marginBottom:8, display:'flex', justifyContent: m.sender_id === user.user_id ? 'flex-end' : 'flex-start'}}>
            <div style={{maxWidth:'70%', padding:'8px 12px', borderRadius:12, background: m.sender_id === user.user_id ? '#DCFCE7' : '#F3F4F6'}}>
              <div style={{fontSize:14}}>{m.content}</div>
              <div style={{fontSize:11, color:'#6b7280', marginTop:4}}>{new Date(m.created_at).toLocaleString('vi-VN')}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{padding:12, borderTop:'1px solid #eee', display:'flex', gap:8}}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && sendMessage()}
          placeholder="Nhập nội dung..."
          style={{flex:1, padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
        />
        <button onClick={sendMessage} style={{padding:'10px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:8}}>Gửi</button>
      </div>
    </div>
  );
}
