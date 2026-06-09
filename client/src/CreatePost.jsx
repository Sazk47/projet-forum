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
    const [fileName, setFileName] = useState('Aucun fichier choisi');

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, image: file }));
        setFileName(file ? file.name : 'Aucun fichier choisi');
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

        if (formData.categories.length === 0) {
            setError('Sélectionnez au moins une catégorie.');
            setLoading(false);
            return;
        }

        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('body', formData.body);
            if (formData.image) form.append('image', formData.image);
            formData.categories.forEach(id => form.append('categories', id));

            const response = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                body: form,
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Erreur lors de la création du post');

            setSuccess(true);
            setFormData({ title: '', body: '', image: null, categories: [] });
            setFileName('Aucun fichier choisi');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post">
            <h2>Créer un nouveau post</h2>

            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">Post créé avec succès !</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label htmlFor="title">Titre</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Entrez le titre du post"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="body">Contenu</label>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleInputChange}
                        required
                        rows="5"
                        placeholder="Entrez le contenu du post"
                    />
                </div>

                <div className="form-field">
                    <label>Image (optionnel)</label>
                    <div className="file-input-wrapper">
                        <label className="file-input-label">
                            Choisir un fichier
                            <input
                                type="file"
                                name="image"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </label>
                        <span className="file-name">{fileName}</span>
                    </div>
                </div>

                <div className="form-field">
                    <label>Catégories</label>
                    {categoriesLoading ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chargement…</p>
                    ) : (
                        <div className="categories-grid">
                            {categories.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucune catégorie disponible</p>
                            ) : (
                                categories.map(category => (
                                    <label
                                        key={category.id}
                                        className={`category-chip${formData.categories.includes(category.id) ? ' selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.categories.includes(category.id)}
                                            onChange={() => handleCategoryChange(category.id)}
                                        />
                                        {category.name}
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || formData.categories.length === 0}
                >
                    {loading
                        ? 'Publication…'
                        : formData.categories.length === 0
                            ? 'Sélectionnez une catégorie'
                            : 'Publier le post'}
                </button>
            </form>
        </div>
    );
}

export default CreatePost;
