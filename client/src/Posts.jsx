import { useState, useEffect } from 'react';
import FilterPosts from './FilterPosts';

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

function Posts({ toastTrigger }) {
    const [posts, setPosts]                 = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [filters, setFilters]             = useState({});
    const [userConnected, setUserConnected] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8080/api/auth/user', { credentials: 'include' })
            .then(res => res.json())
            .then(data => { if (data.user) setUserConnected(true); })
            .catch(() => setUserConnected(false));
    }, []);

    const fetchPosts = (filterParams) => {
        setLoading(true);
        let url = 'http://localhost:8080/api/posts';
        const queryParams = new URLSearchParams();
        if (filterParams.category) queryParams.append('category', filterParams.category);
        if (filterParams.mine)     queryParams.append('mine', 'true');
        if (filterParams.liked)    queryParams.append('liked', 'true');
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

    return (
        <div className="posts-section">
            <h1>Posts</h1>
            <FilterPosts onFilterChange={handleFilterChange} userConnected={userConnected} />

            {error && <div className="alert alert-error">Erreur : {error}</div>}

            {loading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

            {!loading && posts.length === 0 && (
                <div className="state-empty">
                    <EmptyIcon />
                    <strong>Aucun post pour l'instant</strong>
                    <span>Sois le premier à publier quelque chose !</span>
                </div>
            )}

            {!loading && posts.map(post => (
                <div key={post.id} className="post-card">
                    <h2>{post.title}</h2>

                    {post.image_path && (
                        <img
                            className="post-image"
                            src={`http://localhost:8080${post.image_path}`}
                            alt={post.title}
                        />
                    )}

                    <p>{post.body}</p>

                    {post.categories && post.categories.length > 0 && (
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
                </div>
            ))}
        </div>
    );
}

export default Posts;
