function About() {
    return (
        <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '28px',
            marginBottom: '28px',
            fontFamily: 'Inter, sans-serif',
        }}>
            <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--accent-light)',
                marginBottom: '16px',
                letterSpacing: '-0.3px',
            }}>
                À propos
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>
                Bienvenue sur notre forum communautaire ! Ce projet a été conçu dans le cadre d'un projet étudiant pour apprendre le développement web côté serveur, la gestion de bases de données, et la containerisation avec Docker.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>
                Le forum permet aux utilisateurs de créer des posts, commenter, liker ou disliker du contenu, et de filtrer les discussions par catégories.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
                Ce projet est développé avec <span style={{ color: 'var(--accent-light)' }}>Node.js</span>, <span style={{ color: 'var(--accent-light)' }}>SQLite</span>, <span style={{ color: 'var(--accent-light)' }}>React</span> et <span style={{ color: 'var(--accent-light)' }}>Docker</span>.
            </p>
        </div>
    );
}

export default About;