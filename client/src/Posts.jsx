import { useState, useEffect } from 'react';
import FilterPosts from './FilterPosts';
import PostDetail from './PostDetail';

const API = 'http://localhost:8080';

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)     return "à l'instant";
    if (diff < 3600)   return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} jour${Math.floor(diff / 86400) > 1 ? 's' : ''}`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function SkeletonCard() {
    return (
        <div className="post-card skeleton-card" aria-hidden="true">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton-tags">
                <div className="skeleton skeleton-tag" />
                <div className="skeleton skeleton-tag" />
            </div>
            <div className="skeleton skeleton-meta" />
        </div>
    );
}

const EmptyIcon = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="36" rx="6" stroke="#6c63ff" strokeWidth="2"/>
        <path d="M8 20h48" stroke="#6c63ff" strokeWidth="2"/>
        <circle cx="16" cy="16" r="2" fill="#6c63ff"/>
        <circle cx="22" cy="16" r="2" fill="#6c63ff"/>
        <circle cx="28" cy="16" r="2" fill="#6c63ff"/>
        <path d="M20 32h24M20 38h16" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/>
        <path d="M40 52l8 6V52h4a4 4 0 004-4V36" stroke="#a89cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const IconEye = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const IconMsg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
);

const IconThumbUp = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
    </svg>
);

const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);

// Carte résumé cliquable
function PostCard({ post, onClick }) {
    return (
        <div className="post-card" onClick={onClick} style={{ cursor: 'pointer' }}>
            <h2>{post.title}</h2>
            <p style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {post.body}
            </p>
            {post.categories?.length > 0 && (
                <div className="post-tags">
                    {post.categories.map(cat => (
                        <span key={cat.id} className="post-tag">{cat.name}</span>
                    ))}
                </div>
            )}
            <div className="post-meta">
                Par <span>{post.username}</span>
                {post.created_at && <> · {timeAgo(post.created_at)}</>}
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconEye /> {post.views || 0} vue{post.views !== 1 ? 's' : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconMsg /> {post.comments_count || 0} réponse{post.comments_count !== 1 ? 's' : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconThumbUp /> {post.likes_count || 0} like{post.likes_count !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}

function Posts({ toastTrigger, user, requireAuth }) {
    const [posts, setPosts]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [filters, setFilters]         = useState({ sort: 'recent', order: 'desc' });
    const [currentUser, setCurrentUser] = useState(user || null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [postLoading, setPostLoading]   = useState(false);

    useEffect(() => {
        fetch(`${API}/api/auth/user`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setCurrentUser(data.user || null))
            .catch(() => setCurrentUser(null));
    }, [user]);

    const fetchPosts = (filterParams) => {
        setLoading(true);
        let url = `${API}/api/posts`;
        const queryParams = new URLSearchParams();
        if (filterParams.category) queryParams.append('category', filterParams.category);
        if (filterParams.mine)     queryParams.append('mine', 'true');
        if (filterParams.liked)    queryParams.append('liked', 'true');
        if (filterParams.sort)     queryParams.append('sort', filterParams.sort);
        if (filterParams.order)    queryParams.append('order', filterParams.order);
        if (queryParams.toString()) url += '?' + queryParams.toString();

        fetch(url, { credentials: 'include' })
            .then(res => res.json())
            .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    };

    useEffect(() => { if (toastTrigger > 0) fetchPosts(filters); }, [toastTrigger]);
    useEffect(() => { fetchPosts(filters); }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchPosts(newFilters);
    };

    const handlePostDeleted = (id) => {
        setPosts(prev => prev.filter(p => p.id !== id));
        setSelectedPost(null);
    };

    const handleOpenPost = async (post) => {
        setPostLoading(true);
        try {
            // Appel GET /api/posts/:id pour incrémenter les vues
            const res = await fetch(`${API}/api/posts/${post.id}`, { credentials: 'include' });
            const data = await res.json();
            setSelectedPost(data);
            // Met à jour les vues dans la liste
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
        } catch {
            setSelectedPost(post);
        } finally {
            setPostLoading(false);
        }
    };

    const handleClosePost = () => {
        setSelectedPost(null);
    };

    // Vue détail plein écran
    if (selectedPost) {
        return (
            <div className="posts-section">
                <button
                    onClick={handleClosePost}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', color: 'var(--accent-light)',
                        cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                        marginBottom: '20px', padding: '0'
                    }}
                >
                    <IconBack /> Retour aux posts
                </button>
                <PostDetail
                    post={selectedPost}
                    currentUser={currentUser}
                    timeAgo={timeAgo}
                    requireAuth={requireAuth}
                    onPostDeleted={handlePostDeleted}
                />
            </div>
        );
    }

    // Vue liste
    return (
        <div className="posts-section">
            <h1>Posts</h1>
            <FilterPosts onFilterChange={handleFilterChange} userConnected={!!currentUser} />

            {error && <div className="alert alert-error">Erreur : {error}</div>}

            {(loading || postLoading) && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

            {!loading && !postLoading && posts.length === 0 && (
                <div className="state-empty">
                    <EmptyIcon />
                    <strong>Aucun post pour l'instant</strong>
                    <span>Sois le premier à publier quelque chose !</span>
                </div>
            )}

            {!loading && !postLoading && posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handleOpenPost(post)}
                />
            ))}
        </div>
    );
}

export default Posts;