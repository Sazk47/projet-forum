import { useState, useEffect } from 'react';

const API = '';

const IconThumbUp = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
    </svg>
);

const IconThumbDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
        <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
    </svg>
);

const IconComment = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
);

const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
);

const IconEye = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const IconMsg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
);

function PostDetail({ post, currentUser, timeAgo, requireAuth, onPostDeleted, statsBar }) {
    const [likes, setLikes]               = useState({ likes: 0, dislikes: 0, user_vote: null });
    const [comments, setComments]         = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [editingId, setEditingId]       = useState(null);
    const [editContent, setEditContent]   = useState('');
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState(post.title);
    const [editPostBody, setEditPostBody]   = useState(post.body);
    const [postData, setPostData]           = useState(post);

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
        if (!currentUser) { requireAuth(); return; }
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
        if (!currentUser) { requireAuth(); return; }
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
        if (!currentUser) { requireAuth(); return; }
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
            setComments(prev => prev.map(c =>
                c.id === id ? { ...c, content: editContent.trim(), edited: true } : c
            ));
            setEditingId(null);
            setEditContent('');
        } else { const d = await res.json(); alert(d.error || 'Erreur'); }
    };

    const handleDeletePost = async () => {
        if (!window.confirm('Supprimer ce post ?')) return;
        const res = await fetch(`${API}/api/posts/${post.id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            onPostDeleted && onPostDeleted(post.id);
        } else {
            const d = await res.json();
            alert(d.error || 'Erreur lors de la suppression');
        }
    };

    const handleEditPost = async () => {
        if (!editPostTitle.trim() || !editPostBody.trim()) return;
        const res = await fetch(`${API}/api/posts/${post.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title: editPostTitle.trim(), body: editPostBody.trim() })
        });
        if (res.ok) {
            setPostData(prev => ({ ...prev, title: editPostTitle.trim(), body: editPostBody.trim() }));
            setIsEditingPost(false);
        } else {
            const d = await res.json();
            alert(d.error || 'Erreur lors de la modification');
        }
    };

    const isMine = (userId) => currentUser && Number(currentUser.id) === Number(userId);

    return (
        <div className="post-card">
            {isEditingPost ? (
                <div>
                    <input
                        type="text"
                        className="comment-textarea"
                        style={{ width: '100%', marginBottom: '10px', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '16px', fontFamily: 'Syne, sans-serif', fontWeight: '700' }}
                        value={editPostTitle}
                        onChange={e => setEditPostTitle(e.target.value)}
                    />
                    <textarea
                        className="comment-textarea"
                        style={{ width: '100%', marginBottom: '10px' }}
                        rows="5"
                        value={editPostBody}
                        onChange={e => setEditPostBody(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-comment-send" onClick={handleEditPost}>Sauvegarder</button>
                        <button className="btn-comment-cancel" onClick={() => setIsEditingPost(false)}>Annuler</button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h2>{postData.title}</h2>
                        {isMine(post.user_id) && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="comment-action-btn"
                                    onClick={() => { setIsEditingPost(true); setEditPostTitle(postData.title); setEditPostBody(postData.body); }}>
                                    <IconEdit />
                                </button>
                                <button className="comment-action-btn" onClick={handleDeletePost}>
                                    <IconTrash />
                                </button>
                            </div>
                        )}
                    </div>

                    {postData.image_path && (
                        <img className="post-image" src={`${API}${postData.image_path}`} alt={postData.title} />
                    )}

                    <p>{postData.body}</p>

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

                    {/* Stats bar : vues, réponses, likes */}
                    <div style={{
                        display: 'flex', gap: '14px', alignItems: 'center',
                        fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconEye /> {post.views || 0} vue{post.views !== 1 ? 's' : ''}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconMsg /> {post.comments_count || 0} réponse{post.comments_count !== 1 ? 's' : ''}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconThumbUp /> {post.likes_count || 0} like{post.likes_count !== 1 ? 's' : ''}
                        </span>
                    </div>
                </>
            )}

            <div className="post-actions">
                <button
                    className={`vote-btn${likes.user_vote === 'like' ? ' vote-btn--active-like' : ''}`}
                    onClick={() => handleVotePost('like')}
                >
                    <IconThumbUp /> <span>{likes.likes}</span>
                </button>
                <button
                    className={`vote-btn${likes.user_vote === 'dislike' ? ' vote-btn--active-dislike' : ''}`}
                    onClick={() => handleVotePost('dislike')}
                >
                    <IconThumbDown /> <span>{likes.dislikes}</span>
                </button>
                <button className="comment-toggle-btn" onClick={() => setShowComments(v => !v)}>
                    <IconComment /> {showComments ? 'Masquer' : `Commentaires${comments.length > 0 ? ` (${comments.length})` : ''}`}
                </button>
            </div>

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
                                {c.edited && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        (modifié)
                                    </span>
                                )}
                                {isMine(c.user_id) && (
                                    <div className="comment-actions">
                                        <button className="comment-action-btn"
                                            onClick={() => { setEditingId(c.id); setEditContent(c.content); }}>
                                            <IconEdit />
                                        </button>
                                        <button className="comment-action-btn"
                                            onClick={() => handleDeleteComment(c.id)}>
                                            <IconTrash />
                                        </button>
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
                                ><IconThumbUp /> {c.likes || 0}</button>
                                <button
                                    className={`vote-btn vote-btn--sm${c.user_vote === 'dislike' ? ' vote-btn--active-dislike' : ''}`}
                                    onClick={() => handleVoteComment(c.id, 'dislike')}
                                ><IconThumbDown /> {c.dislikes || 0}</button>
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
                            <button
                                onClick={requireAuth}
                                style={{ color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Connectez-vous
                            </button> pour commenter.
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