import { useState, useEffect } from 'react';
import FilterPosts from './FilterPosts';
import PostDetail from './PostDetail';

function Posts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Vérifier si l'utilisateur est connecté (simple vérification via session)
    useEffect(() => {
        fetch('http://localhost:8080/api/auth/user', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) setCurrentUser(data.user);
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
        <FilterPosts onFilterChange={handleFilterChange} userConnected={!!currentUser} />
    
        {loading && <div>Chargement...</div>}
        {error && <div style={{ color: 'red' }}>Erreur: {error}</div>}
    
        {!loading && posts.length === 0 && <div>Aucun post ne correspond aux filtres.</div>}
        {!loading && posts.map(post => (
            <PostDetail key={post.id} post={post} currentUser={currentUser} />
        ))}
    </div>
    );
}

export default Posts;