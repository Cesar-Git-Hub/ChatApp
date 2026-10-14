import { Fragment, useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';

const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const day = (d) =>
  new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

export default function Conversation({
  contact, me, messages, hasMore, online, onSend, onLoadOlder, onBack, onRemove,
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => setText(''), [contact?.id]);

  // Scroll down only for new messages, not when older ones are loaded above
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [contact?.id, lastId]);

  if (!contact) {
    return (
      <main className="convo empty-convo">
        <p>Pick a contact to start chatting.</p>
      </main>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (await onSend(t)) setText(''); // keeps your draft if sending fails
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) submit(e);
  };

  return (
    <main className="convo">
      <header className="convo-head">
        <button className="back" onClick={onBack} aria-label="Back to contacts">
          ←
        </button>
        <Avatar name={contact.username} size={36} />
        <h2>{contact.username}</h2>
        {!online && <span className="status">Reconnecting…</span>}
        <button
          className="link danger"
          onClick={() =>
            window.confirm(`Remove ${contact.username} from your contacts?`) && onRemove()
          }
        >
          Remove
        </button>
      </header>

      <div className="thread">
        {hasMore && (
          <button className="more" onClick={onLoadOlder}>
            Load earlier messages
          </button>
        )}
        {messages.length === 0 && (
          <p className="hello">No messages yet. Say hello to {contact.username}.</p>
        )}
        {messages.map((m, i) => {
          const newDay =
            i === 0 ||
            new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
          const mine = m.from === me;
          return (
            <Fragment key={m.id}>
              {newDay && <p className="day">{day(m.createdAt)}</p>}
              <div className={`msg ${mine ? 'me' : 'them'}`}>
                <p className={`bubble ${mine ? 'me' : 'them'}`}>
                  {m.text}
                  <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                </p>
              </div>
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          maxLength={2000}
          placeholder={`Message ${contact.username}`}
          aria-label={`Message ${contact.username}`}
        />
        <button className="btn" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
