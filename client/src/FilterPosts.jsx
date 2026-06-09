import { useState, useEffect } from 'react';

function FilterPosts({ onFilterChange, userConnected }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMine, setShowMine] = useState(false);
    const [showLiked, setShowLiked] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erreur chargement catégories:', err));
    }, []);

    const handleCategoryChange = (categoryId) => {
        const next = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(next);
        setShowMine(false);
        setShowLiked(false);
        onFilterChange({ category: next });
    };

    const handleMineChange = () => {
        const next = !showMine;
        setShowMine(next);
        setShowLiked(false);
        setSelectedCategory(null);
        onFilterChange({ mine: next });
    };

    const handleLikedChange = () => {
        const next = !showLiked;
        setShowLiked(next);
        setShowMine(false);
        setSelectedCategory(null);
        onFilterChange({ liked: next });
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setShowMine(false);
        setShowLiked(false);
        onFilterChange({});
    };

    const hasFilter = selectedCategory || showMine || showLiked;

    return (
        <div className="filter-bar">
            <h3>Filtrer les posts</h3>

            <div className="filter-row">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`filter-btn${selectedCategory === cat.id ? ' active-cat' : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}

                {userConnected && (
                    <>
                        <div className="filter-divider" />
                        <button
                            onClick={handleMineChange}
                            className={`filter-btn${showMine ? ' active-mine' : ''}`}
                        >
                            {showMine ? '✓ ' : ''}Mes posts
                        </button>
                        <button
                            onClick={handleLikedChange}
                            className={`filter-btn${showLiked ? ' active-liked' : ''}`}
                        >
                            {showLiked ? '♥ ' : '♡ '}Aimés
                        </button>
                    </>
                )}

                {hasFilter && (
                    <button onClick={handleClearFilters} className="filter-btn reset">
                        Réinitialiser
                    </button>
                )}
            </div>
        </div>
    );
}

export default FilterPosts;
