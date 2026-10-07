import React, { JSX } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import { usePageDataStore } from '@site/src/store/pageDataStore';
import PageTabs from '../PageTabs';
import styles from '../Editor/index.module.css';

interface ArticleEditorProps {
    onAddNew?: (parentId?: string | null) => void;
    onEditMeta?: () => void;
    onAddNewArticle?: () => void;
}

export default function ArticleEditor({ onAddNew, onAddNewArticle }: ArticleEditorProps): JSX.Element {
    const { colorMode } = useColorMode();
    const activeDocument = usePageDataStore(
        (state) => state.documents.find((d) => d.id === state.activeDocumentId) ?? null
    );

    return (
        <div className={`${styles.editorPageWrapper} ${colorMode === 'dark' ? styles.darkMode : ''}`}>
            <div className={styles.navColumn}>
                <PageTabs onAddNew={onAddNew} onAddNewArticle={onAddNewArticle} />
            </div>
            <div className={styles.mainAndTocWrapper}>
                <div className={styles.editorColumn}>
                    <div className={styles.editorContainer}>
                        <div style={{ padding: '2rem', color: 'var(--sapTextColor, #32363a)' }}>
                            <h2 style={{ marginTop: 0 }}>{activeDocument?.title || 'Untitled Article'}</h2>
                            <p>Article editor coming soon.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
