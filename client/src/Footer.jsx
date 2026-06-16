function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--border)',
            marginTop: '60px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
        }}>
            <p style={{ marginBottom: '8px' }}>
                © {new Date().getFullYear()} Forum — Tous droits réservés
            </p>
            <p>
                Ce forum est un projet étudiant. Les contenus publiés sont sous la responsabilité de leurs auteurs.
                Les données personnelles sont utilisées uniquement dans le cadre de l'authentification.
            </p>
        </footer>
    );
}

export default Footer;