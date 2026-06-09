import { useState, useEffect } from 'react';
import FilterPosts from './FilterPosts';

function Posts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});
    const [userConnected, setUserConnected] = useState(false);

    // Vérifier si l'utilisateur est connecté (simple vérification via session)
    useEffect(() => {
        fetch('http://localhost:8080/api/auth/user', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) setUserConnected(true);
            })
            .catch(() => setUserConnected(false));
    }, []);

    // Charger les posts avec les filtres
    const fetchPosts = (filterParams) => {
        setLoading(true);
        let url = 'http://localhost:8080/api/posts';
        const queryParams = new URLSearchParams();

        if (filterParams.category) {
            queryParams.append('category', filterParams.category);
        }
        if (filterParams.mine) {
            queryParams.append('mine', 'true');
        }
        if (filterParams.liked) {
            queryParams.append('liked', 'true');
        }

        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }

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

    // Charger les posts au démarrage
    useEffect(() => {
        fetchPosts(filters);
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        fetchPosts(newFilters);
    };

    return (
        <div>
            <h1>Liste des posts</h1>
            <FilterPosts onFilterChange={handleFilterChange} userConnected={userConnected} />
            
            {loading && <div>Chargement...</div>}
            {error && <div style={{ color: 'red' }}>Erreur: {error}</div>}
            
            {!loading && posts.length === 0 && <div>Aucun post ne correspond aux filtres.</div>}
            {!loading && posts.map(post => (
                <div key={post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
                    <h2>{post.title}</h2>
                    {post.image_path && (
                        <img 
                            src={`http://localhost:8080${post.image_path}`} 
                            alt={post.title}
                            style={{ maxWidth: '100%', height: 'auto', marginBottom: '10px', borderRadius: '4px' }}
                        />
                    )}
                    <p>{post.body}</p>
                    
                    {post.categories && post.categories.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            {post.categories.map(category => (
                                <span 
                                    key={category.id}
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: '#e0e0e0',
                                        color: '#333',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        marginRight: '5px',
                                        fontSize: '12px',
                                        marginBottom: '5px'
                                    }}
                                >
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    <small>Par {post.username}</small>
                </div>
            ))}
        </div>
    );
}

export default Posts;