import React, { useState, useEffect, JSX, useCallback } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './index.module.css';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePageDataStore, PageMetadata } from '@site/src/store/pageDataStore';
import MetadataFormDialog from '@site/src/components/MetaFormDialog';
import ContentTypeDialog, { ContentType } from '@site/src/components/ContentTypeDialog';
import ArticleFormDialog, { ArticleMetadata } from '@site/src/components/ArticleFormDialog';
import { useAuth } from '@site/src/context/AuthContext';
import Header from '@site/src/components/CustomHeader/Header';
import { BusyIndicator, Button, Card, Dialog, FlexBox, Icon, Text, Title } from '@ui5/webcomponents-react';
import useIsMobile from '@site/src/hooks/useIsMobile';

function EditorComponent({ onAddNew, onEditMeta, onAddNewArticle, onSapLogin }: { onAddNew: (parentId?: string | null) => void; onEditMeta?: () => void; onAddNewArticle?: () => void; onSapLogin?: () => void }) {
    const activeDocumentId = usePageDataStore((state) => state.activeDocumentId);

    if (!activeDocumentId) {
        return <div className={styles.noDocumentSelected}>Please select or create a document.</div>;
    }

    return (
        <BrowserOnly>
            {() => {
                const Editor = require('@site/src/components/Editor').default;
                return <Editor key={activeDocumentId} onAddNew={onAddNew} onEditMeta={onEditMeta} onAddNewArticle={onAddNewArticle} onSapLogin={onSapLogin} />;
            }}
        </BrowserOnly>
    );
}


const initialPageData: PageMetadata = {
    title: '',
    tags: [],
    authors: [],
    contributors: [],
};

function AuthenticatedQuickStartView() {
    const [isContentTypeOpen, setIsContentTypeOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
    const [articleFormData, setArticleFormData] = useState<ArticleMetadata>({ title: '' });
    const [isArticleEditMode, setIsArticleEditMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newDocData, setNewDocData] = useState<PageMetadata>(initialPageData);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const { documents, addDocument, setBackendConfig, fetchDocuments, isLoading, isCreating, getActiveDocument, updateDocument } = usePageDataStore();
    const history = useHistory();
    const { siteConfig } = useDocusaurusContext();
    const baseUrl = siteConfig.baseUrl;
    const { users, token } = useAuth();
    const { expressBackendUrl, backendUrl } = siteConfig.customFields as { expressBackendUrl: string; backendUrl: string };
    const isSapUser = users.btp !== null || users.github?.isSapEmployee === true;
    const articleAuthors = (siteConfig.customFields?.articleAuthors ?? {}) as Record<
        string,
        { name?: string; title?: string; socials?: { linkedin?: string } }
    >;
    const [initialized, setInitialized] = useState(false);

    // Builds the initial Create-Article form state, pre-filling (and locking) author
    // details when the signed-in GitHub user already exists in news/authors.yml.
    const buildInitialArticleData = useCallback((): ArticleMetadata => {
        const username = users.github?.username;
        const existing = username ? articleAuthors[username] : undefined;
        if (existing) {
            return {
                title: '',
                authorResolved: true,
                authorName: existing.name,
                authorTitle: existing.title,
                authorLinkedin: existing.socials?.linkedin,
            };
        }
        // Fallback: check localStorage for an author cached after a prior local publish.
        // This lets the "in registry" state reflect immediately in local dev without
        // waiting for the PR to be merged and authors.yml rebuilt.
        if (username) {
            try {
                const cached = localStorage.getItem(`qs_author_${username}`);
                if (cached) {
                    const parsed = JSON.parse(cached) as { name?: string; title?: string; linkedin?: string };
                    return {
                        title: '',
                        authorResolved: true,
                        authorName: parsed.name,
                        authorTitle: parsed.title,
                        authorLinkedin: parsed.linkedin,
                    };
                }
                // Pending cache: filled in but not yet submitted — pre-fill fields but don't show registry strip.
                const pending = localStorage.getItem(`qs_author_pending_${username}`);
                if (pending) {
                    const parsed = JSON.parse(pending) as { name?: string; title?: string; linkedin?: string };
                    return {
                        title: '',
                        authorResolved: false,
                        authorName: parsed.name,
                        authorTitle: parsed.title,
                        authorLinkedin: parsed.linkedin,
                    };
                }
            } catch {
                // localStorage unavailable — fall through
            }
        }
        return { title: '', authorResolved: false };
    }, [users.github, articleAuthors]);

    // Initialize backend config and fetch documents
    useEffect(() => {
        if (expressBackendUrl && token && !initialized) {
            const username = users.github?.username || '';
            setBackendConfig(expressBackendUrl, token, username);
            fetchDocuments().then(() => {
                setInitialized(true);
            });
        }
    }, [expressBackendUrl, token, initialized, setBackendConfig, fetchDocuments, users.github]);

    const handleAddNew = useCallback((parentId: string | null = null) => {
        const newDocWithAuthor = {
            ...initialPageData,
            authors: users.github ? [users.github.username] : [],
            contributors: users.github ? [users.github.username] : [],
        };
        setNewDocData(newDocWithAuthor);
        setCurrentParentId(parentId);
        setIsEditMode(false);
        // First-time creation (no documents yet) for SAP employees shows the
        // 2-option chooser (Ref Arch vs Article). Once documents exist, the split
        // sidebar's dedicated "New Ref Arch" / "New Article" buttons go straight to
        // their specific form — so this always creates a Reference Architecture.
        if (parentId === null && documents.length === 0) {
            setIsContentTypeOpen(true);
        } else {
            setIsModalOpen(true);
        }
    }, [users.github, documents.length]);

    const handleSapLogin = useCallback(() => {
        const originUri = encodeURIComponent(`${window.location.origin}${window.location.pathname}`);
        window.location.href = `${backendUrl}/user/login?origin_uri=${originUri}&provider=btp`;
    }, [backendUrl]);

    const handleContentTypeSelect = useCallback((type: ContentType) => {
        setIsContentTypeOpen(false);
        if (type === 'ref-arch') {
            setIsModalOpen(true);
        } else if (type === 'article') {
            setArticleFormData(buildInitialArticleData());
            setIsArticleEditMode(false);
            setIsArticleFormOpen(true);
        }
    }, [buildInitialArticleData]);

    // Opens the Article creation form directly (used by the "Article +" button
    // in the split sidebar).
    const handleAddNewArticle = useCallback(() => {
        setArticleFormData(buildInitialArticleData());
        setIsArticleEditMode(false);
        setIsArticleFormOpen(true);
    }, [buildInitialArticleData]);

    const handleArticleSave = useCallback(() => {
        const username = users.github?.username;
        if (isArticleEditMode) {
            const activeDoc = getActiveDocument();
            if (activeDoc) {
                updateDocument(activeDoc.id, {
                    title: articleFormData.title,
                    description: articleFormData.description || '',
                    authorName: articleFormData.authorName,
                    authorTitle: articleFormData.authorTitle,
                    authorLinkedin: articleFormData.authorLinkedin,
                    authorResolved: articleFormData.authorResolved,
                });
            }
            // Keep the pending cache in sync so new articles pick up the updated details.
            if (username && articleFormData.authorName && !articleFormData.authorResolved) {
                try {
                    localStorage.setItem(
                        `qs_author_pending_${username}`,
                        JSON.stringify({
                            name: articleFormData.authorName,
                            title: articleFormData.authorTitle,
                            linkedin: articleFormData.authorLinkedin,
                        }),
                    );
                } catch {
                    // localStorage unavailable — no-op
                }
            }
        } else {
            addDocument({
                title: articleFormData.title,
                description: articleFormData.description || '',
                tags: [],
                authors: users.github ? [users.github.username] : [],
                contributors: users.github ? [users.github.username] : [],
                // Author details for the news/authors.yml upsert at publish time.
                authorName: articleFormData.authorName,
                authorTitle: articleFormData.authorTitle,
                authorLinkedin: articleFormData.authorLinkedin,
                authorResolved: articleFormData.authorResolved,
            }, null, 'article');

            // Cache author details locally so they survive page reloads and
            // pre-fill subsequent article forms — until the user publishes,
            // at which point qs_author_<username> takes over.
            if (username && articleFormData.authorName && !articleFormData.authorResolved) {
                try {
                    localStorage.setItem(
                        `qs_author_pending_${username}`,
                        JSON.stringify({
                            name: articleFormData.authorName,
                            title: articleFormData.authorTitle,
                            linkedin: articleFormData.authorLinkedin,
                        }),
                    );
                } catch {
                    // localStorage unavailable — no-op
                }
            }
        }
        setIsArticleFormOpen(false);
        setIsArticleEditMode(false);
    }, [articleFormData, users.github, addDocument, isArticleEditMode, getActiveDocument, updateDocument]);

    const handleArticleCancel = useCallback(() => {
        setIsArticleFormOpen(false);
        setIsArticleEditMode(false);
        if (documents.length === 0 && isSapUser) {
            setIsContentTypeOpen(true);
        } else if (documents.length === 0) {
            history.push(baseUrl);
        }
    }, [documents.length, isSapUser, history, baseUrl]);

    const handleContentTypeCancel = useCallback(() => {
        setIsContentTypeOpen(false);
        if (documents.length === 0) {
            history.push(baseUrl);
        }
    }, [documents.length, history, baseUrl]);

    const handleEditMeta = useCallback(() => {
        const activeDoc = getActiveDocument();
        if (!activeDoc) return;

        // Articles are edited through the Article form, not the RA metadata form.
        if (activeDoc.type === 'article') {
            setArticleFormData({
                title: activeDoc.title,
                description: activeDoc.description || '',
                authorName: activeDoc.authorName,
                authorTitle: activeDoc.authorTitle,
                authorLinkedin: activeDoc.authorLinkedin,
                // Re-check the registry live so the "in registry" strip shows
                // correctly even if the author was added after the doc was created.
                authorResolved: buildInitialArticleData().authorResolved,
            });
            setIsArticleEditMode(true);
            setIsArticleFormOpen(true);
            return;
        }

        setNewDocData({
            title: activeDoc.title,
            tags: activeDoc.tags,
            authors: activeDoc.authors,
            contributors: activeDoc.contributors || [],
            description: activeDoc.description || '',
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    }, [getActiveDocument, buildInitialArticleData]);

    useEffect(() => {
        if (initialized && documents.length === 0) {
            handleAddNew(null);
        }
    }, [documents.length, handleAddNew, initialized]);

    const handleCreate = () => {
        if (isEditMode) {
            const activeDoc = getActiveDocument();
            if (activeDoc) {
                updateDocument(activeDoc.id, {
                    title: newDocData.title,
                    tags: newDocData.tags,
                    description: newDocData.description,
                    contributors: newDocData.contributors,
                });
            }
        } else {
            addDocument(newDocData, currentParentId);
        }
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        if (documents.length === 0 && isSapUser) {
            setIsContentTypeOpen(true);
        } else if (documents.length === 0) {
            history.push(baseUrl);
        }
    };

    // Show initializing screen only on first load (fetching documents)
    if (isLoading || !initialized) {
        return (
            <div className={styles.initializingContainer}>
                <BusyIndicator active size="L" text="Initializing Command Center..." />
            </div>
        );
    }

    // Show loader when creating a new ref arch
    if (isCreating) {
        return (
            <div className={styles.initializingContainer}>
                <BusyIndicator active size="L" text="Creating document..." />
            </div>
        );
    }

    return (
        <>
            <ContentTypeDialog
                open={isContentTypeOpen}
                isSapUser={isSapUser}
                onSelect={handleContentTypeSelect}
                onSapLogin={handleSapLogin}
                onCancel={handleContentTypeCancel}
            />
            <ArticleFormDialog
                open={isArticleFormOpen}
                initialData={articleFormData}
                authorUsername={users.github?.username}
                authorAvatar={users.github?.avatar}
                isEditMode={isArticleEditMode}
                onDataChange={(updates) => setArticleFormData((prev) => ({ ...prev, ...updates }))}
                onSave={handleArticleSave}
                onCancel={handleArticleCancel}
            />
            <MetadataFormDialog
                open={isModalOpen}
                initialData={newDocData}
                onDataChange={(updates) => setNewDocData((prev) => ({ ...prev, ...updates }))}
                onSave={handleCreate}
                onCancel={handleCancel}
                isEditMode={isEditMode}
            />
            <main className={styles.pageContainer}>
                <EditorComponent onAddNew={handleAddNew} onEditMeta={handleEditMeta} onAddNewArticle={isSapUser ? handleAddNewArticle : undefined} onSapLogin={handleSapLogin} />
            </main>
        </>
    );
}

function MobileDeviceWarning() {
    const history = useHistory();
    const { siteConfig } = useDocusaurusContext();
    const baseUrl = siteConfig.baseUrl;

    const handleHome = () => {
        history.push(baseUrl);
    };
    return (
        <Dialog open>
            <div className={styles.warningDialogContent}>
                <Icon name="alert" className={styles.warningIcon} />
                <Text>The QuickStart editor is not available for mobiles and tablets.</Text>
                <Button design="Emphasized" onClick={handleHome}>
                    Return to Home
                </Button>
            </div>
        </Dialog>
    );
}

function GitHubLoginRedirect({ loginUrl }: { loginUrl: string }) {
    useEffect(() => {
        // Redirect immediately to GitHub login
        window.location.href = loginUrl;
    }, [loginUrl]);

    // Fallback UI while redirecting (or if redirect fails)
    return (
        <Card
            header={
                <FlexBox className={styles.centeredCardHeader}>
                    <Icon name="locked" />
                    <Title level="H5" wrappingType="None">
                        GitHub Authentication Required
                    </Title>
                </FlexBox>
            }
            className={styles.authCard}
        >
            <div className={styles.authCardContent}>
                <FlexBox alignItems="Center" justifyContent="Center" style={{ marginBottom: '1rem' }}>
                    <BusyIndicator active size="M" />
                </FlexBox>
                <Text>Redirecting to GitHub login...</Text>
                <Text style={{ marginTop: '1rem', color: '#666' }}>
                    If you are not redirected automatically,{' '}
                    <a href={loginUrl} style={{ color: '#0a6ed1' }}>click here</a>.
                </Text>
            </div>
        </Card>
    );
}

export default function QuickStart(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const { users, loading } = useAuth();
    const isMobile = useIsMobile();

    const isGithubAuthenticated = users.github !== null;
    const { expressBackendUrl } = siteConfig.customFields as {
        expressBackendUrl: string;
    };

    if (isMobile) {
        return (
            <Layout>
                <MobileDeviceWarning />
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout>
                <Header title="Quick Start" subtitle="Loading..." breadcrumbCurrent="Quick Start" />
                <main className={styles.mainContainer}>
                    <FlexBox alignItems="Center" justifyContent="Center" style={{ padding: '2rem' }}>
                        <Text>Checking authentication...</Text>
                    </FlexBox>
                </main>
            </Layout>
        );
    }

    if (!isGithubAuthenticated) {
        const originUri = `${window.location.origin}${siteConfig.baseUrl}quick-start`;
        const loginUrl = `${expressBackendUrl}/user/login?origin_uri=${encodeURIComponent(originUri)}&provider=github`;

        return (
            <Layout>
                <Header
                    title="Quick Start"
                    subtitle="Redirecting to GitHub login..."
                    breadcrumbCurrent="Quick Start"
                />
                <main className={styles.mainContainer}>
                    <GitHubLoginRedirect loginUrl={loginUrl} />
                </main>
            </Layout>
        );
    }

    return (
        <Layout>
            <AuthenticatedQuickStartView />
        </Layout>
    );
}
