import { useEffect, useState } from 'react';
import { api } from '../api';
import Avatar from './Avatar';

export default function Sidebar({ user, contacts, activeId, unread, online, onSelect, onAdd, onLogout }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Search users as you type (waits 250 ms after the last key)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .searchUsers(term)
        .then((d) => setResults(d.users))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const add = async (username) => {
    setError('');
    try {
      await onAdd(username);
      setQ('');
      setResults([]);
    } catch (e) {
      setError(e.message);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) add(q.trim());
  };

  return (
    <aside className="sidebar">
      <header className="side-head">
        <h1 className="wordmark small">ChatApp</h1>
        <span
          className={`dot ${online ? 'on' : ''}`}
          title={online ? 'Connected' : 'Reconnecting…'}
          aria-label={online ? 'Connected' : 'Reconnecting'}
        />
      </header>

      <form className="search" onSubmit={submit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a username to add"
          aria-label="Find a username to add"
        />
      </form>
      {error && (
        <p className="side-error" role="alert">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="results">
          {results.map((u) => (
            <li key={u.id}>
              <button onClick={() => add(u.username)}>
                <Avatar name={u.username} size={32} />
                <span>{u.username}</span>
                <span className="add">Add</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <nav className="contacts" aria-label="Contacts">
        {contacts.length === 0 ? (
          <p className="empty">No contacts yet. Search a username above to start a conversation.</p>
        ) : (
          <ul>
            {contacts.map((c) => (
              <li key={c.id}>
                <button
                  className={c.id === activeId ? 'active' : ''}
                  onClick={() => onSelect(c.id)}
                >
                  <Avatar name={c.username} size={40} />
                  <span className="name">{c.username}</span>
                  {unread[c.id] > 0 && <span className="badge">{unread[c.id]}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <footer className="me">
        <Avatar name={user.username} size={32} />
        <span className="me-name">{user.username}</span>
        <button className="link" onClick={onLogout}>
          Sign out
        </button>
      </footer>
    </aside>
  );
}
