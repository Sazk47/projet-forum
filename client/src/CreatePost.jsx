import { useState, useEffect } from 'react';

function CreatePost() {
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        image: null,
        categories: []
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Récupérer les catégories
    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setCategoriesLoading(false);
            })
            .catch(err => {
                console.error('Erreur lors du chargement des catégories:', err);
                setCategoriesLoading(false);
            });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        setFormData(prev => ({
            ...prev,
            image: e.target.files[0]
        }));
    };

    const handleCategoryChange = (categoryId) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryId)
                ? prev.categories.filter(id => id !== categoryId)
                : [...prev.categories, categoryId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Vérifier que au moins une catégorie est sélectionnée
        if (formData.categories.length === 0) {
            setError('Vous devez sélectionner au moins une catégorie');
            setLoading(false);
            return;
        }

        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('body', formData.body);
            if (formData.image) {
                form.append('image', formData.image);
            }
            // Ajouter les catégories (chaque ID séparément)
            formData.categories.forEach(categoryId => {
                form.append('categories', categoryId);
            });

            const response = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                body: form,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création du post');
            }

            setSuccess(true);
            setFormData({ title: '', body: '', image: null, categories: [] });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Créer un nouveau post</h2>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>Erreur: {error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>Post créé avec succès!</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="title">Titre:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        placeholder="Entrez le titre du post"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="body">Contenu:</label>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleInputChange}
                        required
                        rows="5"
                        style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        placeholder="Entrez le contenu du post"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="image">Image:</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{ marginTop: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Catégories:</label>
                    {categoriesLoading ? (
                        <p>Chargement des catégories...</p>
                    ) : (
                        <div style={{ marginTop: '5px' }}>
                            {categories.length === 0 ? (
                                <p>Aucune catégorie disponible</p>
                            ) : (
                                categories.map(category => (
                                    <div key={category.id} style={{ marginBottom: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.categories.includes(category.id)}
                                                onChange={() => handleCategoryChange(category.id)}
                                                style={{ marginRight: '8px' }}
                                            />
                                            <span>{category.name}</span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || formData.categories.length === 0}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: (loading || formData.categories.length === 0) ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Création en cours...' : formData.categories.length === 0 ? 'Sélectionnez une catégorie' : 'Créer le post'}
                </button>
            </form>
        </div>
    );
}

export default CreatePost;
