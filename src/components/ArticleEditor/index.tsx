import React, { JSX } from 'react';

interface ArticleEditorProps {
    onAddNew?: (parentId?: string | null) => void;
    onEditMeta?: () => void;
}

export default function ArticleEditor(_props: ArticleEditorProps): JSX.Element {
    return (
        <div style={{ padding: '2rem', color: 'var(--sapTextColor, #32363a)' }}>
            Article editor coming soon.
        </div>
    );
}
