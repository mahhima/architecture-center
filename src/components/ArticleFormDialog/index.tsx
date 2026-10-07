import React, { JSX } from 'react';
import { Bar, Button, Dialog, FlexBox, Form, FormItem, Input, Label, MessageStrip, Text, TextArea, Title } from '@ui5/webcomponents-react';

export interface ArticleMetadata {
    title: string;
    description?: string;
    // Author details (article-only)
    authorName?: string;
    authorTitle?: string;
    authorLinkedin?: string;
    // True when the author was found in news/authors.yml — collection is skipped.
    authorResolved?: boolean;
}

interface InputEvent {
    target: { value: string };
}

interface ArticleFormDialogProps {
    open: boolean;
    initialData: ArticleMetadata;
    // The signed-in GitHub username and avatar, shown on the author card.
    authorUsername?: string;
    authorAvatar?: string;
    // When true, the dialog is editing an existing article rather than creating one.
    isEditMode?: boolean;
    onDataChange: (updates: Partial<ArticleMetadata>) => void;
    onSave: () => void;
    onCancel: () => void;
}

export default function ArticleFormDialog({
    open,
    initialData,
    authorUsername,
    authorAvatar,
    isEditMode = false,
    onDataChange,
    onSave,
    onCancel,
}: ArticleFormDialogProps): JSX.Element {
    const authorResolved = initialData.authorResolved === true;
    const authorInfoComplete =
        authorResolved ||
        ((initialData.authorName?.trim().length ?? 0) > 0 && (initialData.authorTitle?.trim().length ?? 0) > 0);
    const isFormValid = initialData.title.trim().length > 0 && authorInfoComplete;

    return (
        <Dialog
            open={open}
            style={{ width: '560px' }}
            header={
                <Bar>
                    <Title>{isEditMode ? 'Edit Article' : 'Create New Article'}</Title>
                </Bar>
            }
            footer={
                <Bar
                    endContent={
                        <>
                            <Button design="Emphasized" onClick={onSave} disabled={!isFormValid}>
                                {isEditMode ? 'Save' : 'Create'}
                            </Button>
                            <Button onClick={onCancel}>Cancel</Button>
                        </>
                    }
                />
            }
        >
            <Form style={{ padding: '1rem' }}>
                <FormItem labelContent={<Label required>Title</Label>}>
                    <Input
                        value={initialData.title}
                        onInput={(e: InputEvent) => onDataChange({ title: e.target.value })}
                        required
                        placeholder="Add your article title..."
                    />
                </FormItem>
                <FormItem labelContent={<Label>Description</Label>}>
                    <TextArea
                        style={{ minHeight: '80px', width: '100%' }}
                        value={initialData.description || ''}
                        onInput={(e: InputEvent) => onDataChange({ description: e.target.value })}
                        placeholder="Add a short description..."
                    />
                </FormItem>

                {/* ── Author ── */}
                <FormItem labelContent={<Label required>Author</Label>}>
                    <FlexBox alignItems="Center">
                        {authorAvatar && (
                            <img
                                src={authorAvatar}
                                alt={authorUsername}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        )}
                        <Text style={{ marginLeft: '0.5rem' }}>{authorUsername || 'Loading...'}</Text>
                    </FlexBox>
                </FormItem>

                {authorResolved ? (
                    <MessageStrip design="Positive" hideCloseButton style={{ marginTop: '0.25rem' }}>
                        You&apos;re in the author registry — your author details will be reused.
                    </MessageStrip>
                ) : (
                    <>
                        <MessageStrip design="Information" hideCloseButton style={{ marginTop: '0.25rem' }}>
                            You&apos;re not in the author registry yet. Add your details below — they&apos;ll be
                            included with your article submission.
                        </MessageStrip>
                        <FormItem labelContent={<Label required>Your Name</Label>}>
                            <Input
                                value={initialData.authorName || ''}
                                onInput={(e: InputEvent) => onDataChange({ authorName: e.target.value })}
                                required
                                placeholder="Your Name"
                            />
                        </FormItem>
                        <FormItem labelContent={<Label required>Title / Role</Label>}>
                            <Input
                                value={initialData.authorTitle || ''}
                                onInput={(e: InputEvent) => onDataChange({ authorTitle: e.target.value })}
                                required
                                placeholder="e.g. Head of Architecture - Office of the CTO"
                            />
                        </FormItem>
                        <FormItem labelContent={<Label>LinkedIn Handle</Label>}>
                            <Input
                                value={initialData.authorLinkedin || ''}
                                onInput={(e: InputEvent) => onDataChange({ authorLinkedin: e.target.value })}
                                placeholder="(optional)"
                            />
                        </FormItem>
                    </>
                )}
            </Form>
        </Dialog>
    );
}
