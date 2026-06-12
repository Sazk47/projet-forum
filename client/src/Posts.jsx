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

function Posts({ toastTrigger }) {
    const [posts, setPosts]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [filters, setFilters]           = useState({});
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

    // Recharge les posts quand un nouveau post est créé
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
                <div className="state-empty">Aucun post ne correspond aux filtres.</div>
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
                        {post.created_at && (
                            <> · {timeAgo(post.created_at)}</>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Posts;
