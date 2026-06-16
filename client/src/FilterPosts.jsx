import { useState, useEffect } from 'react';

function FilterPosts({ onFilterChange, userConnected }) {
    const [categories, setCategories]             = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMine, setShowMine]                 = useState(false);
    const [showLiked, setShowLiked]               = useState(false);
    const [sort, setSort]                         = useState('recent');
    const [order, setOrder]                       = useState('desc');

    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Erreur chargement catégories:', err));
    }, []);

    const emit = (overrides) => {
        onFilterChange({
            category: selectedCategory,
            mine: showMine,
            liked: showLiked,
            sort,
            order,
            ...overrides
        });
    };

    const handleCategoryChange = (categoryId) => {
        const next = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(next);
        setShowMine(false);
        setShowLiked(false);
        emit({ category: next, mine: false, liked: false });
    };

    const handleMineChange = () => {
        const next = !showMine;
        setShowMine(next);
        setShowLiked(false);
        setSelectedCategory(null);
        emit({ mine: next, liked: false, category: null });
    };

    const handleLikedChange = () => {
        const next = !showLiked;
        setShowLiked(next);
        setShowMine(false);
        setSelectedCategory(null);
        emit({ liked: next, mine: false, category: null });
    };

    const handleSortChange = (newSort) => {
        setSort(newSort);
        emit({ sort: newSort });
    };

    const handleOrderChange = (newOrder) => {
        setOrder(newOrder);
        emit({ order: newOrder });
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setShowMine(false);
        setShowLiked(false);
        setSort('recent');
        setOrder('desc');
        onFilterChange({ sort: 'recent', order: 'desc' });
    };

    const hasFilter = selectedCategory || showMine || showLiked || sort !== 'recent' || order !== 'desc';

    return (
        <div className="filter-bar">
            <h3>Filtrer les posts</h3>

            {/* Tri */}
            <div className="filter-row" style={{ marginBottom: '10px' }}>
                <button
                    onClick={() => handleSortChange('recent')}
                    className={`filter-btn${sort === 'recent' ? ' active-cat' : ''}`}
                >
                    Récent
                </button>
                <button
                    onClick={() => handleSortChange('top')}
                    className={`filter-btn${sort === 'top' ? ' active-cat' : ''}`}
                >
                    Top likés
                </button>
                <button
                    onClick={() => handleSortChange('views')}
                    className={`filter-btn${sort === 'views' ? ' active-cat' : ''}`}
                >
                    Top vus
                </button>

                <div className="filter-divider" />

                <button
                    onClick={() => handleOrderChange('desc')}
                    className={`filter-btn${order === 'desc' ? ' active-cat' : ''}`}
                >
                    ↓ Décroissant
                </button>
                <button
                    onClick={() => handleOrderChange('asc')}
                    className={`filter-btn${order === 'asc' ? ' active-cat' : ''}`}
                >
                    ↑ Croissant
                </button>
            </div>

            {/* Catégories & filtres utilisateur */}
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
                            Mes posts
                        </button>
                        <button
                            onClick={handleLikedChange}
                            className={`filter-btn${showLiked ? ' active-liked' : ''}`}
                        >
                            Aimés
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