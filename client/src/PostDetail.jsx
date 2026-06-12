import { useState, useEffect } from 'react';

const API = 'http://localhost:8080';

function PostDetail({ post, currentUser, timeAgo }) {
    const [likes, setLikes]             = useState({ likes: 0, dislikes: 0, user_vote: null });
    const [comments, setComments]       = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [editingId, setEditingId]     = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetch(`${API}/api/likes?post_id=${post.id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setLikes(data))
            .catch(() => {});
    }, [post.id]);

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
        const res  = await fetch(`${API}/api/likes?post_id=${post.id}`, { credentials: 'include' });
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
        const res  = await fetch(`${API}/api/likes?comment_id=${commentId}`, { credentials: 'include' });
        const data = await res.json();
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes, user_vote: data.user_vote } : c
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

        if (res.ok) { setCommentInput(''); fetchComments(); }
        else { const d = await res.json(); alert(d.error || 'Erreur'); }
    };

    const handleDeleteComment = async (id) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return;
        const res = await fetch(`${API}/api/comments/${id}`, { method: 'DELETE', credentials: 'include' });
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
            setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent.trim() } : c));
            setEditingId(null);
            setEditContent('');
        } else { const d = await res.json(); alert(d.error || 'Erreur'); }
    };

    return (
        <div className="post-card">
            <h2>{post.title}</h2>

            {post.image_path && (
                <img className="post-image" src={`${API}${post.image_path}`} alt={post.title} />
            )}

            <p>{post.body}</p>

            {post.categories?.length > 0 && (
                <div className="post-tags">
                    {post.categories.map(cat => (
                        <span key={cat.id} className="post-tag">{cat.name}</span>
                    ))}
                </div>
            )}

            <div className="post-meta">
                Par <span>{post.username}</span>
                {post.created_at && <> · {timeAgo(post.created_at)}</>}
            </div>

            {/* Votes du post */}
            <div className="post-actions">
                <button
                    className={`vote-btn${likes.user_vote === 'like' ? ' vote-btn--active-like' : ''}`}
                    onClick={() => handleVotePost('like')}
                >
                    👍 <span>{likes.likes}</span>
                </button>
                <button
                    className={`vote-btn${likes.user_vote === 'dislike' ? ' vote-btn--active-dislike' : ''}`}
                    onClick={() => handleVotePost('dislike')}
                >
                    👎 <span>{likes.dislikes}</span>
                </button>
                <button
                    className="comment-toggle-btn"
                    onClick={() => setShowComments(v => !v)}
                >
                    💬 {showComments ? 'Masquer' : `Commentaires${comments.length > 0 ? ` (${comments.length})` : ''}`}
                </button>
            </div>

            {/* Section commentaires */}
            {showComments && (
                <div className="comments-section">
                    <div className="comments-divider" />

                    {comments.length === 0 && (
                        <p className="comments-empty">Aucun commentaire pour l'instant.</p>
                    )}

                    {comments.map(c => (
                        <div key={c.id} className="comment">
                            <div className="comment-header">
                                <span className="comment-author">{c.username}</span>
                                <span className="comment-date">{formatDate(c.created_at)}</span>
                                {currentUser?.id === c.user_id && (
                                    <div className="comment-actions">
                                        <button className="comment-action-btn"
                                            onClick={() => { setEditingId(c.id); setEditContent(c.content); }}>✏️</button>
                                        <button className="comment-action-btn"
                                            onClick={() => handleDeleteComment(c.id)}>🗑️</button>
                                    </div>
                                )}
                            </div>

                            {editingId === c.id ? (
                                <div className="comment-edit">
                                    <textarea className="comment-textarea"
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)} />
                                    <div className="comment-edit-btns">
                                        <button className="btn-comment-send" onClick={() => handleEditComment(c.id)}>Sauvegarder</button>
                                        <button className="btn-comment-cancel" onClick={() => setEditingId(null)}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="comment-content">{c.content}</p>
                            )}

                            <div className="comment-votes">
                                <button
                                    className={`vote-btn vote-btn--sm${c.user_vote === 'like' ? ' vote-btn--active-like' : ''}`}
                                    onClick={() => handleVoteComment(c.id, 'like')}
                                >👍 {c.likes || 0}</button>
                                <button
                                    className={`vote-btn vote-btn--sm${c.user_vote === 'dislike' ? ' vote-btn--active-dislike' : ''}`}
                                    onClick={() => handleVoteComment(c.id, 'dislike')}
                                >👎 {c.dislikes || 0}</button>
                            </div>
                        </div>
                    ))}

                    {currentUser ? (
                        <div className="comment-form">
                            <textarea
                                className="comment-textarea"
                                placeholder="Votre commentaire…"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                            />
                            <button className="btn-comment-send" onClick={handleSubmitComment}>Envoyer</button>
                        </div>
                    ) : (
                        <p className="comments-empty">
                            <a href="http://localhost:8080/html/login.html" style={{ color: 'var(--accent-light)' }}>
                                Connectez-vous
                            </a> pour commenter.
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

export default PostDetail;