import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../api';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import Conversation from '../components/Conversation';

const PAGE = 50; // must match the default page size of GET /api/messages/:id

const norm = (m) => ({ ...m, id: String(m.id), from: String(m.from), to: String(m.to) });

// Merge two message lists: no duplicates (by id), oldest first
const merge = (a = [], b = []) => {
  const map = new Map();
  [...a, ...b].forEach((m) => map.set(m.id, m));
  return [...map.values()].sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));
};

export default function ChatPage() {
  const { user, token, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState({}); // contactId -> messages[]
  const [hasMore, setHasMore] = useState({});
  const [unread, setUnread] = useState({});
  const [online, setOnline] = useState(false);
  const [notice, setNotice] = useState('');

  const socketRef = useRef(null);
  const activeRef = useRef(null);
  const contactsRef = useRef([]);
  activeRef.current = activeId;
  contactsRef.current = contacts;

  const loadContacts = useCallback(
    () =>
      api
        .contacts()
        .then((d) => setContacts(d.contacts.map((c) => ({ ...c, id: String(c.id) }))))
        .catch((e) => setNotice(e.message)),
    []
  );

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const addLocal = useCallback(
    (cid, m) => setMessages((p) => ({ ...p, [cid]: merge(p[cid], [m]) })),
    []
  );

  // Real-time connection, authenticated with the same token as the REST API
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setOnline(true));
    socket.on('disconnect', () => setOnline(false));
    socket.on('connect_error', () => setOnline(false));

    socket.on('message:new', (raw) => {
      const m = norm(raw);
      const other = m.from === user.id ? m.to : m.from;
      addLocal(other, m);
      if (m.from !== user.id && other !== activeRef.current) {
        setUnread((u) => ({ ...u, [other]: (u[other] || 0) + 1 }));
      }
      // Someone added you: refresh the list so they appear
      if (!contactsRef.current.some((c) => c.id === other)) loadContacts();
    });

    return () => socket.disconnect();
  }, [token, user.id, addLocal, loadContacts]);

  const select = async (cid) => {
    setActiveId(cid);
    setUnread((u) => ({ ...u, [cid]: 0 }));
    try {
      const { messages: list } = await api.history(cid);
      setMessages((p) => ({ ...p, [cid]: merge(p[cid], list.map(norm)) }));
      setHasMore((h) => ({ ...h, [cid]: list.length === PAGE }));
    } catch (e) {
      setNotice(e.message);
    }
  };

  const loadOlder = async (cid) => {
    const first = (messages[cid] || [])[0];
    if (!first) return;
    try {
      const { messages: list } = await api.history(cid, first.createdAt);
      setMessages((p) => ({ ...p, [cid]: merge(list.map(norm), p[cid]) }));
      setHasMore((h) => ({ ...h, [cid]: list.length === PAGE }));
    } catch (e) {
      setNotice(e.message);
    }
  };

  const send = (text) =>
    new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        setNotice('Not connected. Your message was not sent.');
        return resolve(false);
      }
      socket.emit('message:send', { to: activeId, text }, (res) => {
        if (res && res.ok) {
          addLocal(activeId, norm(res.message));
          resolve(true);
        } else {
          setNotice((res && res.message) || 'Message not sent');
          resolve(false);
        }
      });
    });

  const addContact = async (username) => {
    const { contact } = await api.addContact(username);
    await loadContacts();
    select(String(contact.id));
  };

  const removeContact = async (id) => {
    try {
      await api.removeContact(id);
      setContacts((c) => c.filter((x) => x.id !== id));
      setActiveId(null);
    } catch (e) {
      setNotice(e.message);
    }
  };

  const active = contacts.find((c) => c.id === activeId) || null;

  return (
    <div className={`chat ${active ? 'has-active' : ''}`}>
      <Sidebar
        user={user}
        contacts={contacts}
        activeId={activeId}
        unread={unread}
        online={online}
        onSelect={select}
        onAdd={addContact}
        onLogout={logout}
      />
      <Conversation
        contact={active}
        me={user.id}
        messages={messages[activeId] || []}
        hasMore={!!hasMore[activeId]}
        online={online}
        onSend={send}
        onLoadOlder={() => loadOlder(activeId)}
        onBack={() => setActiveId(null)}
        onRemove={() => removeContact(activeId)}
      />
      {notice && (
        <div className="toast" role="alert" onClick={() => setNotice('')}>
          {notice}
        </div>
      )}
    </div>
  );
}
