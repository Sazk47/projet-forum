import { useState, useEffect } from 'react';
import FilterPosts from './FilterPosts';

function Posts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});
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
            .then(data => {
                setPosts(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => { fetchPosts(filters); }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchPosts(newFilters);
    };

    return (
        <div className="posts-section">
            <h1>Posts</h1>
            <FilterPosts onFilterChange={handleFilterChange} userConnected={userConnected} />

            {loading && <div className="state-loading">Chargement…</div>}
            {error   && <div className="alert alert-error">Erreur : {error}</div>}

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
                            {post.categories.map(category => (
                                <span key={category.id} className="post-tag">
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="post-meta">
                        Par <span>{post.username}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Posts;
