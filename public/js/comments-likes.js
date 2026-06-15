const API = 'http://localhost:8080';



async function loadComments(postId) {
    const res  = await fetch(`${API}/api/comments?post_id=${postId}`, { credentials: 'include' });
    const data = await res.json();

    const container = document.getElementById('comments-list');
    container.innerHTML = '';

    if (!data.comments?.length) {
        container.innerHTML = '<p class="no-comments">Aucun commentaire pour l\'instant.</p>';
        return;
    }

    data.comments.forEach(c => renderComment(c, container));
}

function renderComment(c, container) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.dataset.id = c.id;

    const isOwner = window.__currentUserId && c.user_id === window.__currentUserId;

    div.innerHTML = `
        <div class="comment-header">
            <strong class="comment-author">${escapeHtml(c.username)}</strong>
            <span class="comment-date">${formatDate(c.created_at)}</span>
            ${isOwner ? `
                <button class="btn-edit-comment"   onclick="startEditComment(${c.id})">✏️</button>
                <button class="btn-delete-comment" onclick="deleteComment(${c.id})">🗑️</button>
            ` : ''}
        </div>
        <p class="comment-content" id="comment-content-${c.id}">${escapeHtml(c.content)}</p>
        <div class="comment-edit-form hidden" id="comment-edit-${c.id}">
            <textarea id="comment-edit-text-${c.id}">${escapeHtml(c.content)}</textarea>
            <button onclick="submitEditComment(${c.id})">Sauvegarder</button>
            <button onclick="cancelEditComment(${c.id})">Annuler</button>
        </div>
        <div class="comment-likes">
            <button class="btn-like ${c.user_vote === 'like' ? 'active' : ''}"
                    onclick="voteComment(${c.id}, 'like', this)">
                👍 <span class="like-count">${c.likes}</span>
            </button>
            <button class="btn-dislike ${c.user_vote === 'dislike' ? 'active' : ''}"
                    onclick="voteComment(${c.id}, 'dislike', this)">
                👎 <span class="dislike-count">${c.dislikes}</span>
            </button>
        </div>
    `;
    container.appendChild(div);
}

async function submitComment(postId) {
    const input = document.getElementById('comment-input');
    const content = input?.value?.trim();
    if (!content) return;

    const res = await fetch(`${API}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId, content })
    });

    if (res.status === 401) {
        alert('Connectez-vous pour commenter.');
        return;
    }

    if (res.ok) {
        input.value = '';
        await loadComments(postId);
    } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'envoi');
    }
}

function startEditComment(id) {
    document.getElementById(`comment-content-${id}`).classList.add('hidden');
    document.getElementById(`comment-edit-${id}`).classList.remove('hidden');
}

function cancelEditComment(id) {
    document.getElementById(`comment-content-${id}`).classList.remove('hidden');
    document.getElementById(`comment-edit-${id}`).classList.add('hidden');
}

async function submitEditComment(id) {
    const content = document.getElementById(`comment-edit-text-${id}`).value.trim();
    if (!content) return;

    const res = await fetch(`${API}/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
    });

    if (res.ok) {
        document.getElementById(`comment-content-${id}`).textContent = content;
        cancelEditComment(id);
    } else {
        const data = await res.json();
        alert(data.error || 'Erreur de modification');
    }
}

async function deleteComment(id) {
    if (!confirm('Supprimer ce commentaire ?')) return;

    const res = await fetch(`${API}/api/comments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (res.ok) {
        document.querySelector(`.comment[data-id="${id}"]`)?.remove();
    } else {
        const data = await res.json();
        alert(data.error || 'Erreur de suppression');
    }
}



async function votePost(postId, type, btn) {
    const res = await fetch(`${API}/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId, type })
    });

    if (res.status === 401) {
        alert('Connectez-vous pour voter.');
        return;
    }

    if (res.ok) await refreshPostLikes(postId);
}

async function voteComment(commentId, type, btn) {
    const res = await fetch(`${API}/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment_id: commentId, type })
    });

    if (res.status === 401) {
        alert('Connectez-vous pour voter.');
        return;
    }

    if (res.ok) {
        const data = await res.json();
        const commentEl = document.querySelector(`.comment[data-id="${commentId}"]`);
        if (!commentEl) return;


        const countsRes = await fetch(`${API}/api/likes?comment_id=${commentId}`, { credentials: 'include' });
        const counts = await countsRes.json();

        commentEl.querySelector('.like-count').textContent    = counts.likes;
        commentEl.querySelector('.dislike-count').textContent = counts.dislikes;
        commentEl.querySelector('.btn-like').classList.toggle('active',    counts.user_vote === 'like');
        commentEl.querySelector('.btn-dislike').classList.toggle('active', counts.user_vote === 'dislike');
    }
}

async function refreshPostLikes(postId) {
    const res  = await fetch(`${API}/api/likes?post_id=${postId}`, { credentials: 'include' });
    const data = await res.json();

    const likeBtn    = document.getElementById('post-like-btn');
    const dislikeBtn = document.getElementById('post-dislike-btn');

    if (likeBtn)    { likeBtn.querySelector('.like-count').textContent    = data.likes;    likeBtn.classList.toggle('active',    data.user_vote === 'like');    }
    if (dislikeBtn) { dislikeBtn.querySelector('.dislike-count').textContent = data.dislikes; dislikeBtn.classList.toggle('active', data.user_vote === 'dislike'); }
}



function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}