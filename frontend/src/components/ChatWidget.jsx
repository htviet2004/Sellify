import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { API_BASE } from '../data/constants';
import { buildWsUrl } from '../utils/wsConfig';

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const normalizeConversation = (raw = {}) => ({
  id: raw.id || raw.conversation_id || `${raw.shop_id || 'shop'}-${raw.buyer_id || 'buyer'}`,
  shopId: raw.shop_id || raw.shop?.id || raw.shopId,
  shopName: raw.shop_name || raw.shop?.name || raw.shopName || `Shop #${raw.shop_id || raw.shopId || '?'}`,
  shopAvatar: raw.shop_avatar || raw.shop?.avatar,
  buyerId: raw.buyer_id || raw.buyer?.id || raw.buyerId,
  buyerName: raw.buyer_name || raw.buyer?.full_name || raw.buyerName || `Khách #${raw.buyer_id || raw.buyerId || '?'}`,
  productId: raw.product_id || raw.product?.id,
  productName: raw.product_name || raw.product?.name,
  lastMessage: raw.last_message || raw.lastMessage || 'Chưa có tin nhắn',
  updatedAt: raw.updated_at || raw.last_message_at || raw.updatedAt || new Date().toISOString(),
  unreadCount: raw.unread_count || raw.unreadCount || 0,
});

const buildFallbackConversations = (user) => {
  if (!user) return [];
  const now = new Date();
  return [
    {
      id: 'demo-1',
      shopId: user.user_type === 'seller' ? user.user_id : 101,
      shopName: user.user_type === 'seller' ? 'Shop của bạn' : 'Shop thời trang',
      buyerId: user.user_type === 'seller' ? 501 : user.user_id,
      buyerName: user.user_type === 'seller' ? 'Khách mới' : 'Bạn',
      productName: 'Áo cotton form rộng',
      lastMessage: 'Xin chào! Shop còn size M không?',
      updatedAt: now.toISOString(),
      unreadCount: user.user_type === 'seller' ? 2 : 0,
    },
    {
      id: 'demo-2',
      shopId: user.user_type === 'seller' ? user.user_id : 205,
      shopName: user.user_type === 'seller' ? 'Shop của bạn' : 'Giày Sneaker Pro',
      buyerId: user.user_type === 'seller' ? 777 : user.user_id,
      buyerName: user.user_type === 'seller' ? 'Nguyễn Trà My' : 'Bạn',
      productName: 'Sneaker Runner X',
      lastMessage: 'Shop phản hồi: Sản phẩm sẽ giao trong hôm nay nha!',
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      unreadCount: 0,
    },
  ];
};

const ChatWidget = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const hasLoadedRef = useRef(false);
  const [drawerHeight, setDrawerHeight] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef({ startY: 0, startHeight: 420 });
  const notificationSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef({});
  const [unreadTotal, setUnreadTotal] = useState(0);

  const isSeller = user?.user_type === 'seller';

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Vui lòng đăng nhập để sử dụng chat.');
      const res = await fetch(`${API_BASE}/api/chat/conversations/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Không thể tải cuộc trò chuyện.');
      const data = await res.json();
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setConversations(list.map(normalizeConversation));
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Fetch conversations error:', err);
      if (!hasLoadedRef.current) {
        setConversations(buildFallbackConversations(user).map(normalizeConversation));
      }
      setError(err.message || 'Đã xảy ra lỗi khi tải danh sách cuộc trò chuyện.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setUnreadTotal(conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0));
  }, [conversations]);

  const ensureAudioContext = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playMessageChime = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 920;
      gainNode.gain.value = 0.08;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (err) {
      console.warn('Unable to play sound', err);
    }
  }, [ensureAudioContext]);

  const pushToast = useCallback((toast) => {
    const id = toast.id || window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const nextToast = {
      id,
      title: toast.title || 'Thông báo',
      message: toast.message || '',
      meta: toast.meta || '',
      accent: toast.accent || 'info',
    };
    setToasts((prev) => [...prev, nextToast]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, toast.duration || 6000);
    toastTimersRef.current[id] = timeout;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    if (toastTimersRef.current[id]) {
      clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    }
  }, []);

  useEffect(() => {
    if (drawerOpen && !hasLoadedRef.current) {
      fetchConversations();
    }
  }, [drawerOpen, fetchConversations]);

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleOrderAlert = useCallback(
    (payload) => {
      if (!payload) return;
      pushToast({
        title: 'Đơn hàng cập nhật',
        message: payload.message || `Đơn hàng #${payload.order_id} đã cập nhật.`,
        meta: payload.status_label,
        accent: 'order',
      });
    },
    [pushToast]
  );

  const handleChatSummary = useCallback(
    (payload) => {
      if (!payload?.conversation_id) return;
      setConversations((prev) => {
        let exists = false;
        const mapped = prev
          .map((conv) => {
            if (conv.id === payload.conversation_id) {
              exists = true;
              return {
                ...conv,
                lastMessage: payload.last_message || conv.lastMessage,
                updatedAt: payload.last_message_at || conv.updatedAt,
                unreadCount:
                  typeof payload.unread_count === 'number' ? payload.unread_count : conv.unreadCount,
              };
            }
            return conv;
          })
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        if (exists) {
          return mapped;
        }

        const newcomer = normalizeConversation({
          id: payload.conversation_id,
          buyer_id: payload.buyer_id,
          buyer_name: payload.buyer_name,
          shop_id: payload.shop_id,
          shop_name: payload.shop_name,
          product_id: payload.product_id,
          product_name: payload.product_name,
          last_message: payload.last_message,
          last_message_at: payload.last_message_at,
          unread_count: payload.unread_count || 0,
        });
        return [newcomer, ...mapped];
      });

      const isActive = activeConversation?.id === payload.conversation_id && drawerOpen;
      if (!isActive && payload.sender_id !== user?.user_id) {
        playMessageChime();
      }
    },
    [activeConversation?.id, drawerOpen, playMessageChime, user?.user_id]
  );

  const handleConversationActivity = useCallback((conversationId, latest = {}) => {
    if (!conversationId) return;
    setConversations((prev) => {
      let updated = false;
      const mapped = prev
        .map((conv) => {
          if (conv.id !== conversationId) return conv;
          updated = true;
          return {
            ...conv,
            lastMessage: latest.lastMessage || conv.lastMessage,
            updatedAt: latest.updatedAt || new Date().toISOString(),
            unreadCount: typeof latest.unreadCount === 'number' ? latest.unreadCount : conv.unreadCount,
          };
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return updated ? mapped : prev;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const wsUrl = buildWsUrl('/ws/notifications/', { token });
    if (!wsUrl) {
      console.error('Notification WS error: unable to resolve WebSocket endpoint.');
      return undefined;
    }
    const ws = new WebSocket(wsUrl);
    notificationSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'order_status') handleOrderAlert(data);
        if (data.type === 'chat_summary') handleChatSummary(data);
      } catch (err) {
        console.error('Notification WS parse error', err);
      }
    };
    ws.onerror = (err) => console.error('Notification WS error', err);
    ws.onclose = () => {
      notificationSocketRef.current = null;
    };

    return () => ws.close();
  }, [user, handleOrderAlert, handleChatSummary]);

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    setConversations((prev) =>
      prev.map((item) =>
        item.id === conversation.id ? { ...item, unreadCount: 0 } : item
      )
    );
  };

  const counterpartLabel = (conversation) => {
    if (!conversation) return '';
    return isSeller ? conversation.buyerName : conversation.shopName;
  };

  const toggleDrawer = () => {
    ensureAudioContext();
    setDrawerOpen((prev) => !prev);
  };

  const startResize = (event) => {
    event.preventDefault();
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    resizeStateRef.current = { startY: clientY, startHeight: drawerHeight };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (event) => {
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const delta = resizeStateRef.current.startY - clientY;
      const nextHeight = Math.max(260, Math.min(620, resizeStateRef.current.startHeight + delta));
      setDrawerHeight(nextHeight);
    };
    const stopResize = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchend', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchend', stopResize);
    };
  }, [isResizing]);

  if (!user) return null;

  return (
    <>
      <button
        className="chat-floating-button"
        onClick={toggleDrawer}
        aria-label="Mở chat"
      >
        💬
        {unreadTotal > 0 && (
          <span className="chat-floating-button__badge">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      <div
        className={`chat-drawer ${drawerOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ height: `${drawerHeight}px` }}
      >
        <div
          className="chat-drawer__handle"
          role="presentation"
          onMouseDown={startResize}
          onTouchStart={startResize}
        />
        <div className="chat-drawer__header">
          <div>
            <p>Hộp thư</p>
            <h4>Cuộc trò chuyện</h4>
          </div>
          <button onClick={() => setDrawerOpen(false)} aria-label="Đóng chat">×</button>
        </div>

        <div className="chat-drawer__body">
          {loading && <div className="chat-drawer__empty">Đang tải cuộc trò chuyện...</div>}
          {!loading && error && <div className="chat-drawer__error">{error}</div>}
          {!loading && !conversations.length && !error && (
            <div className="chat-drawer__empty">Chưa có cuộc trò chuyện nào.</div>
          )}

          <div className="chat-conversation-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`chat-conversation-item ${
                  activeConversation?.id === conversation.id ? 'active' : ''
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="chat-conversation-item__avatar">
                  {conversation.shopAvatar ? (
                    <img src={conversation.shopAvatar} alt={conversation.shopName} />
                  ) : (
                    <span>{counterpartLabel(conversation)?.charAt(0)}</span>
                  )}
                </div>
                <div className="chat-conversation-item__content">
                  <div className="chat-conversation-item__row">
                    <strong>{counterpartLabel(conversation)}</strong>
                    <span>{formatRelativeTime(conversation.updatedAt)}</span>
                  </div>
                  <p>
                    {conversation.productName && <em>{conversation.productName} • </em>}
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="chat-conversation-item__badge">{conversation.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeConversation && (
        <ChatPopup
          conversation={activeConversation}
          onClose={() => setActiveConversation(null)}
          isSeller={isSeller}
          counterpartName={counterpartLabel(activeConversation)}
          onIncomingMessage={playMessageChime}
          onConversationActivity={handleConversationActivity}
        />
      )}

      <div className="notification-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`notification-toast notification-toast--${toast.accent}`}>
            <div>
              <p>{toast.title}</p>
              <strong>{toast.message}</strong>
              {toast.meta && <span>{toast.meta}</span>}
            </div>
            <button onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">×</button>
          </div>
        ))}
      </div>
    </>
  );
};

const ChatPopup = ({ conversation, onClose, isSeller, counterpartName, onIncomingMessage, onConversationActivity }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const shopId = useMemo(() => {
    if (isSeller) return conversation.shopId || user?.user_id;
    return conversation.shopId;
  }, [conversation.shopId, isSeller, user?.user_id]);

  const buyerParam = useMemo(() => {
    if (isSeller) return conversation.buyerId;
    return user?.user_id;
  }, [conversation.buyerId, isSeller, user?.user_id]);

  useEffect(() => {
    if (!conversation || !shopId || !buyerParam || !user) return;

    const token = localStorage.getItem('access_token') || '';
    const qs = new URLSearchParams({ token, buyer: buyerParam });
    if (conversation.productId) qs.set('product', conversation.productId);

    const wsUrl = buildWsUrl(`/ws/chat/${shopId}/`, qs);
    if (!wsUrl) {
      console.error('Chat popup WS error: unable to resolve WebSocket endpoint.');
      setConnecting(false);
      return undefined;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnecting(true);

    ws.onopen = () => setConnecting(false);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'history') setMessages(data.messages || []);
        else if (data.type === 'message' && data.message) {
          setMessages((prev) => [...prev, data.message]);
          if (data.message.sender_id !== user?.user_id && typeof onIncomingMessage === 'function') {
            onIncomingMessage();
          }
          if (typeof onConversationActivity === 'function') {
            onConversationActivity(conversation?.id, {
              lastMessage: data.message.content,
              updatedAt: data.message.created_at,
              unreadCount: 0,
            });
          }
        }
      } catch (error) {
        console.error('WS parse error', error);
      }
    };
    ws.onclose = (evt) => {
      if (wsRef.current === ws) {
        setConnecting(false);
      }
      console.log('Chat popup WS closed', evt);
    };
    ws.onerror = (error) => console.error('Chat popup WS error', error);

    return () => ws.close();
  }, [conversation, buyerParam, shopId, user, onIncomingMessage, onConversationActivity]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const content = text.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content }));
    setText('');
  };

  return (
    <div className="chat-popup">
      <div className="chat-popup__header">
        <div>
          <p>{conversation.productName || 'Trò chuyện'}</p>
          <strong>{counterpartName}</strong>
        </div>
        <button onClick={onClose} aria-label="Đóng cuộc trò chuyện">×</button>
      </div>

      <div className="chat-popup__body">
        {connecting && <div className="chat-popup__info">Đang kết nối...</div>}
        {messages.map((message) => (
          <div
            key={message.id || `${message.created_at}-${message.sender_id}`}
            className={`chat-popup__message ${message.sender_id === user?.user_id ? 'me' : ''}`}
          >
            <div className="chat-popup__bubble">
              <div>{message.content}</div>
              <span>{new Date(message.created_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-popup__footer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Nhập nội dung..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatWidget;
