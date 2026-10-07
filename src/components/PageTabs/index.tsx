import React, { useState } from 'react';
import '@ui5/webcomponents-icons/dist/AllIcons';
import { usePageDataStore, Document } from '@site/src/store/pageDataStore';
import { Plus, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './index.module.css';

interface PageTabsProps {
    onAddNew?: (parentId: string | null) => void;
    onAddNewArticle?: () => void;
    onSapLogin?: () => void;
}

const PageTabs: React.FC<PageTabsProps> = ({ onAddNew, onAddNewArticle, onSapLogin }) => {
    const { documents, activeDocumentId, openDocument } = usePageDataStore();

    const [raOpen, setRaOpen] = useState(true);
    const [articlesOpen, setArticlesOpen] = useState(true);

    const handleActionClick = (e: React.MouseEvent | { stopPropagation: () => void }) => {
        e.stopPropagation();
    };

    const renderDocumentTree = (doc: Document, isSharedSection: boolean = false) => {
        const children = documents.filter((child) => child.parentId === doc.id);
        const canAddSubPage = onAddNew && !doc.isReadOnly;

        return (
            <div key={doc.id}>
                <div
                    className={`${styles.navItem} ${!doc.parentId ? styles.rootItem : ''} ${
                        doc.id === activeDocumentId ? styles.active : ''
                    } ${doc.isReadOnly ? styles.readOnlyItem : ''}`}
                    onClick={() => openDocument(doc.id)}
                >
                    <span className={styles.itemTitle} title={doc.title || 'Untitled Page'}>
                        {doc.title || 'Untitled Page'}
                    </span>
                    {canAddSubPage && (
                        <button
                            className={styles.addSubPageButton}
                            onClick={(e) => {
                                handleActionClick(e);
                                onAddNew(doc.id);
                            }}
                            title="Add sub-page"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                    {doc.isReadOnly && !doc.parentId && (
                        <Eye size={14} className={styles.viewOnlyIcon} />
                    )}
                </div>
                {children.length > 0 && (
                    <ul className={styles.childrenList}>
                        {children.map((child) => (
                            <li key={child.id}>{renderDocumentTree(child, isSharedSection)}</li>
                        ))}
                    </ul>
                )}
            </div>
        );
    };

    // Renders the "My Documents" / "Shared with me" split for a given set of root docs.
    const renderDocList = (rootDocs: Document[], emptyMessage: string) => {
        const myDocuments = rootDocs.filter((doc) => !doc.isReadOnly);
        const sharedDocuments = rootDocs.filter((doc) => doc.isReadOnly);

        return (
            <div className={styles.documentsList}>
                {/* My Documents section */}
                {myDocuments.length > 0 && (
                    <>
                        {sharedDocuments.length > 0 && (
                            <div className={styles.sectionHeader}>My Documents</div>
                        )}
                        {myDocuments.map((doc) => renderDocumentTree(doc))}
                    </>
                )}

                {/* Shared with me section */}
                {sharedDocuments.length > 0 && (
                    <>
                        <div className={styles.sectionDivider} />
                        <div className={styles.sectionHeader}>
                            <span>Shared with me</span>
                            <Eye size={14} className={styles.sectionIcon} />
                        </div>
                        <div className={styles.sharedSection}>
                            {sharedDocuments.map((doc) => renderDocumentTree(doc, true))}
                        </div>
                    </>
                )}

                {/* Empty state */}
                {rootDocs.length === 0 && (
                    <div className={styles.emptyState}>{emptyMessage}</div>
                )}
            </div>
        );
    };

    // Separate documents into owned (author) and shared (contributor), then by type
    const rootDocuments = documents.filter((doc) => doc.parentId === null);
    const raDocuments = rootDocuments.filter((doc) => doc.type !== 'article');
    const articleDocuments = rootDocuments.filter((doc) => doc.type === 'article');

    return (
        <div className={styles.navContainer}>
            {/* ── Reference Architectures ── */}
            <button
                className={styles.dropdownHeader}
                onClick={() => setRaOpen((o) => !o)}
                title={raOpen ? 'Collapse' : 'Expand'}
            >
                {raOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Reference Architectures</span>
            </button>
            {raOpen && (
                <>
                    {onAddNew && (
                        <button
                            className={styles.newRefArchButton}
                            onClick={() => onAddNew(null)}
                            title="Create new Reference Architecture"
                        >
                            <span>New Ref Arch</span>
                            <Plus size={18} />
                        </button>
                    )}
                    {renderDocList(raDocuments, 'No documents yet. Create your first Reference Architecture!')}
                </>
            )}

            {/* ── Articles ── */}
            <>
                <button
                    className={styles.dropdownHeader}
                    onClick={() => setArticlesOpen((o) => !o)}
                    title={articlesOpen ? 'Collapse' : 'Expand'}
                >
                    {articlesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span>Articles</span>
                </button>
                {articlesOpen && (
                    <>
                        {onAddNewArticle ? (
                            <button
                                className={styles.newRefArchButton}
                                onClick={onAddNewArticle}
                                title="Create new Article"
                            >
                                <span>New Article</span>
                                <Plus size={18} />
                            </button>
                        ) : (
                            <button
                                className={`${styles.newRefArchButton} ${styles.newRefArchButtonLocked}`}
                                onClick={onSapLogin}
                                title="Login with SAP to access"
                            >
                                <span>New Article</span>
                                <Plus size={18} />
                            </button>
                        )}
                        {renderDocList(articleDocuments, 'No articles yet.')}
                    </>
                )}
            </>
        </div>
    );
};

export default PageTabs;
