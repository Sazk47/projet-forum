export async function apiFetch(url, options = {}) {
    const res = await fetch(url, { credentials: 'include', ...options });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.message || 'Erreur réseau');
        err.status = res.status;
        throw err;
    }

    return res.json();
}

export function getErrorMessage(err) {
    switch (err.status) {
        case 400: return 'Requête invalide : ' + err.message;
        case 401: return 'Connectez-vous pour accéder à ce contenu.';
        case 403: return 'Vous n\'avez pas la permission d\'effectuer cette action.';
        case 404: return 'Ressource introuvable.';
        case 405: return 'Action non autorisée.';
        case 409: return err.message;
        default:  return 'Erreur serveur, réessayez plus tard.';
    }
}
