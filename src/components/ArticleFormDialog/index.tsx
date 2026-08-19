import React, { JSX } from 'react';
import { Bar, Button, Dialog, Form, FormItem, Input, Label, TextArea, Title } from '@ui5/webcomponents-react';

export interface ArticleMetadata {
    title: string;
    description?: string;
}

interface InputEvent {
    target: { value: string };
}

interface ArticleFormDialogProps {
    open: boolean;
    initialData: ArticleMetadata;
    onDataChange: (updates: Partial<ArticleMetadata>) => void;
    onSave: () => void;
    onCancel: () => void;
}

export default function ArticleFormDialog({
    open,
    initialData,
    onDataChange,
    onSave,
    onCancel,
}: ArticleFormDialogProps): JSX.Element {
    const isFormValid = initialData.title.trim().length > 0;

    return (
        <Dialog
            open={open}
            style={{ width: '560px' }}
            header={
                <Bar>
                    <Title>Create New Article</Title>
                </Bar>
            }
            footer={
                <Bar
                    endContent={
                        <>
                            <Button design="Emphasized" onClick={onSave} disabled={!isFormValid}>
                                Create
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
            </Form>
        </Dialog>
    );
}
