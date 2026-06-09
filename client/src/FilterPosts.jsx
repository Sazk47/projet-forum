import { useState, useEffect } from 'react';

function FilterPosts({ onFilterChange, userConnected }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMine, setShowMine] = useState(false);
    const [showLiked, setShowLiked] = useState(false);

    // Récupérer les catégories
    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erreur chargement catégories:', err));
    }, []);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
        setShowMine(false);
        setShowLiked(false);
        onFilterChange({ category: selectedCategory === categoryId ? null : categoryId });
    };

    const handleMineChange = () => {
        setShowMine(!showMine);
        setShowLiked(false);
        setSelectedCategory(null);
        onFilterChange({ mine: !showMine });
    };

    const handleLikedChange = () => {
        setShowLiked(!showLiked);
        setShowMine(false);
        setSelectedCategory(null);
        onFilterChange({ liked: !showLiked });
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setShowMine(false);
        setShowLiked(false);
        onFilterChange({});
    };

    return (
        <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ddd'
        }}>
            <h3 style={{ marginTop: 0 }}>Filtrer les posts</h3>

            <div style={{ marginBottom: '15px' }}>
                <h4>Par catégorie :</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: selectedCategory === cat.id ? '#4CAF50' : '#e0e0e0',
                                color: selectedCategory === cat.id ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {userConnected && (
                <div style={{ marginBottom: '15px' }}>
                    <h4>Mes posts :</h4>
                    <button
                        onClick={handleMineChange}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: showMine ? '#2196F3' : '#e0e0e0',
                            color: showMine ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {showMine ? '✓ Mes posts' : 'Mes posts'}
                    </button>
                </div>
            )}

            {userConnected && (
                <div style={{ marginBottom: '15px' }}>
                    <h4>Posts aimés :</h4>
                    <button
                        onClick={handleLikedChange}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: showLiked ? '#FF9800' : '#e0e0e0',
                            color: showLiked ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {showLiked ? '❤ Posts aimés' : 'Posts aimés'}
                    </button>
                </div>
            )}

            <button
                onClick={handleClearFilters}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#999',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}
            >
                Réinitialiser les filtres
            </button>
        </div>
    );
}

export default FilterPosts;
