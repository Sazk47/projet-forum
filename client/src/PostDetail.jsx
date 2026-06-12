import { useState, useEffect } from 'react';

const API = 'http://localhost:8080';

function PostDetail({ post, currentUser }) {
    const [likes, setLikes] = useState({ likes: 0, dislikes: 0, user_vote: null });
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Charger les likes du post au montage
    useEffect(() => {
        fetch(`${API}/api/likes?post_id=${post.id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setLikes(data))
            .catch(() => {});
    }, [post.id]);

    // Charger les commentaires quand on ouvre la section
    useEffect(() => {
        if (!showComments) return;
        fetchComments();
    }, [showComments]);

    const fetchComments = () => {
        fetch(`${API}/api/comments?post_id=${post.id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setComments(data.comments || []))
            .catch(() => {});
    };



    const handleVotePost = async (type) => {
        if (!currentUser) { alert('Connectez-vous pour voter.'); return; }

        await fetch(`${API}/api/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ post_id: post.id, type })
        });

        // Rafraîchir les compteurs
        const res = await fetch(`${API}/api/likes?post_id=${post.id}`, { credentials: 'include' });
        const data = await res.json();
        setLikes(data);
    };

    const handleVoteComment = async (commentId, type) => {
        if (!currentUser) { alert('Connectez-vous pour voter.'); return; }

        await fetch(`${API}/api/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ comment_id: commentId, type })
        });

        // Rafraîchir les compteurs du commentaire
        const res = await fetch(`${API}/api/likes?comment_id=${commentId}`, { credentials: 'include' });
        const data = await res.json();
        setComments(prev => prev.map(c =>
            c.id === commentId
                ? { ...c, likes: data.likes, dislikes: data.dislikes, user_vote: data.user_vote }
                : c
        ));
    };



    const handleSubmitComment = async () => {
        if (!currentUser) { alert('Connectez-vous pour commenter.'); return; }
        if (!commentInput.trim()) return;

        const res = await fetch(`${API}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ post_id: post.id, content: commentInput.trim() })
        });

        if (res.ok) {
            setCommentInput('');
            fetchComments();
        } else {
            const data = await res.json();
            alert(data.error || 'Erreur');
        }
    };

    const handleDeleteComment = async (id) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return;

        const res = await fetch(`${API}/api/comments/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (res.ok) setComments(prev => prev.filter(c => c.id !== id));
        else { const d = await res.json(); alert(d.error || 'Erreur'); }
    };

    const handleEditComment = async (id) => {
        if (!editContent.trim()) return;

        const res = await fetch(`${API}/api/comments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: editContent.trim() })
        });

        if (res.ok) {
            setComments(prev => prev.map(c =>
                c.id === id ? { ...c, content: editContent.trim() } : c
            ));
            setEditingId(null);
            setEditContent('');
        } else {
            const d = await res.json(); alert(d.error || 'Erreur');
        }
    };



    return (
        <div style={styles.card}>
            {/* Post */}
            <h2 style={styles.title}>{post.title}</h2>

            {post.image_path && (
                <img
                    src={`${API}${post.image_path}`}
                    alt={post.title}
                    style={styles.image}
                />
            )}

            <p style={styles.body}>{post.body}</p>

            {post.categories?.length > 0 && (
                <div style={styles.categories}>
                    {post.categories.map(cat => (
                        <span key={cat.id} style={styles.tag}>{cat.name}</span>
                    ))}
                </div>
            )}

            <small style={styles.meta}>Par {post.username}</small>

            {/* Likes du post */}
            <div style={styles.votes}>
                <button
                    onClick={() => handleVotePost('like')}
                    style={{ ...styles.voteBtn, ...(likes.user_vote === 'like' ? styles.voteBtnActive : {}) }}
                >
                    👍 {likes.likes}
                </button>
                <button
                    onClick={() => handleVotePost('dislike')}
                    style={{ ...styles.voteBtn, ...(likes.user_vote === 'dislike' ? styles.voteBtnActive : {}) }}
                >
                    👎 {likes.dislikes}
                </button>
                <button
                    onClick={() => setShowComments(v => !v)}
                    style={styles.commentToggle}
                >
                    💬 {showComments ? 'Masquer' : 'Commentaires'}
                </button>
            </div>

            {/* Section commentaires */}
            {showComments && (
                <div style={styles.commentsSection}>
                    <hr style={{ borderColor: '#eee', margin: '10px 0' }} />

                    {comments.length === 0 && (
                        <p style={{ color: '#888', fontSize: '14px' }}>Aucun commentaire pour l'instant.</p>
                    )}

                    {comments.map(c => (
                        <div key={c.id} style={styles.comment}>
                            <div style={styles.commentHeader}>
                                <strong style={{ fontSize: '13px' }}>{c.username}</strong>
                                <span style={styles.commentDate}>{formatDate(c.created_at)}</span>
                                {currentUser?.id === c.user_id && (
                                    <span>
                                        <button
                                            onClick={() => { setEditingId(c.id); setEditContent(c.content); }}
                                            style={styles.smallBtn}
                                        >✏️</button>
                                        <button
                                            onClick={() => handleDeleteComment(c.id)}
                                            style={styles.smallBtn}
                                        >🗑️</button>
                                    </span>
                                )}
                            </div>

                            {editingId === c.id ? (
                                <div>
                                    <textarea
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        style={styles.textarea}
                                    />
                                    <button onClick={() => handleEditComment(c.id)} style={styles.btnSend}>Sauvegarder</button>
                                    <button onClick={() => setEditingId(null)} style={{ ...styles.btnSend, background: '#999', marginLeft: '6px' }}>Annuler</button>
                                </div>
                            ) : (
                                <p style={styles.commentContent}>{c.content}</p>
                            )}

                            {/* Likes commentaire */}
                            <div style={styles.commentVotes}>
                                <button
                                    onClick={() => handleVoteComment(c.id, 'like')}
                                    style={{ ...styles.voteSmall, ...(c.user_vote === 'like' ? styles.voteBtnActive : {}) }}
                                >👍 {c.likes || 0}</button>
                                <button
                                    onClick={() => handleVoteComment(c.id, 'dislike')}
                                    style={{ ...styles.voteSmall, ...(c.user_vote === 'dislike' ? styles.voteBtnActive : {}) }}
                                >👎 {c.dislikes || 0}</button>
                            </div>
                        </div>
                    ))}

                    {/* Formulaire nouveau commentaire */}
                    {currentUser ? (
                        <div style={styles.commentForm}>
                            <textarea
                                placeholder="Votre commentaire..."
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                style={styles.textarea}
                            />
                            <button onClick={handleSubmitComment} style={styles.btnSend}>Envoyer</button>
                        </div>
                    ) : (
                        <p style={{ color: '#888', fontSize: '13px' }}>
                            <a href="http://localhost:8080/html/login.html">Connectez-vous</a> pour commenter.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

const styles = {
    card: { border: '1px solid #ccc', padding: '16px', margin: '12px 0', borderRadius: '8px', background: '#fff' },
    title: { margin: '0 0 10px', fontSize: '20px' },
    image: { maxWidth: '100%', height: 'auto', marginBottom: '10px', borderRadius: '6px' },
    body: { margin: '0 0 10px', lineHeight: '1.5' },
    categories: { marginBottom: '8px' },
    tag: { display: 'inline-block', background: '#e0e0e0', color: '#333', padding: '3px 8px', borderRadius: '4px', marginRight: '5px', fontSize: '12px' },
    meta: { color: '#888', fontSize: '12px' },
    votes: { display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' },
    voteBtn: { border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '20px', padding: '5px 14px', cursor: 'pointer', fontSize: '14px' },
    voteBtnActive: { background: '#4A00E0', color: '#fff', borderColor: '#4A00E0' },
    commentToggle: { border: '1px solid #ccc', background: '#f5f5f5', borderRadius: '20px', padding: '5px 14px', cursor: 'pointer', fontSize: '14px', marginLeft: 'auto' },
    commentsSection: { marginTop: '12px' },
    comment: { background: '#f9f9f9', borderRadius: '6px', padding: '10px', marginBottom: '8px' },
    commentHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
    commentDate: { color: '#aaa', fontSize: '11px' },
    commentContent: { margin: '4px 0 8px', fontSize: '14px' },
    commentVotes: { display: 'flex', gap: '6px' },
    voteSmall: { border: '1px solid #ddd', background: '#fff', borderRadius: '20px', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' },
    smallBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '0 2px' },
    commentForm: { marginTop: '10px' },
    textarea: { width: '100%', minHeight: '70px', borderRadius: '6px', border: '1px solid #ccc', padding: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' },
    btnSend: { marginTop: '6px', background: '#4A00E0', color: '#fff', border: 'none', borderRadius: '20px', padding: '7px 20px', cursor: 'pointer', fontSize: '13px' },
};

export default PostDetail;