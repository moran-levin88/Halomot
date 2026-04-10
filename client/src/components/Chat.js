import React, { useState, useEffect, useRef } from 'react';

export default function Chat({ messages, onSend, myName }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const prevLen = useRef(messages.length);

  useEffect(() => {
    if (!open && messages.length > prevLen.current) {
      setUnread(u => u + (messages.length - prevLen.current));
    }
    prevLen.current = messages.length;
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  function send() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      {/* Floating button */}
      <button className="chat-fab" onClick={() => setOpen(o => !o)}>
        💬
        {unread > 0 && <span className="chat-unread">{unread}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>💬 צ'אט</span>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <div className="chat-empty">אין הודעות עדיין</div>}
            {messages.map((msg, i) => {
              const isMe = msg.name === myName;
              return (
                <div key={i} className={`chat-msg ${isMe ? 'me' : 'other'}`}>
                  {!isMe && <div className="chat-name">{msg.name}</div>}
                  <div className="chat-bubble">{msg.text}</div>
                  <div className="chat-time">{formatTime(msg.time)}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="הקלד הודעה..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              autoFocus
            />
            <button className="chat-send" onClick={send}>שלח</button>
          </div>
        </div>
      )}
    </>
  );
}
