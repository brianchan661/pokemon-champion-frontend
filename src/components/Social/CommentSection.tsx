import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Comment as SharedComment } from '@brianchan661/pokemon-champion-shared';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/config/api';
import { Button } from '@/components/UI/Button';
import { ConfirmationModal } from '@/components/UI/ConfirmationModal';
import { MentionTextarea } from '../Strategy/MentionTextarea';
import { StrategyDisplay } from '../Strategy/StrategyDisplay';

const API_URL = getApiBaseUrl();

interface ExtendedComment extends SharedComment {
    replies?: ExtendedComment[];
    authorAvatarUrl?: string;
}

interface CommentSectionProps {
    teamId: string;
    comments: ExtendedComment[];
    isPublic: boolean;
    isAuthenticated: boolean;
}

const CommentItem: React.FC<{
    comment: ExtendedComment;
    teamId: string;
    depth?: number;
    onReply: (author: string, id: string) => void;
}> = ({ comment, teamId, depth = 0, onReply }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [editJson, setEditJson] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const isOwner = user?.id === comment.authorId;
    const isAdmin = user?.role === 'admin';
    const canDelete = isOwner || isAdmin;

    // Update comment mutation
    const updateCommentMutation = useMutation({
        mutationFn: async ({ commentId, content }: { commentId: string, content: string }) => {
            const token = localStorage.getItem('authToken');
            const response = await axios.put(
                `${API_URL}/teams/${teamId}/comments/${commentId}`,
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamComments', teamId] });
            setIsEditing(false);
        },
    });

    // Delete comment mutation
    const deleteMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const token = localStorage.getItem('authToken');
            await axios.delete(
                `${API_URL}/teams/${teamId}/comments/${commentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamComments', teamId] });
            setDeleteModalOpen(false);
        },
    });

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        const contentToSubmit = editJson || editContent.trim();
        await updateCommentMutation.mutateAsync({
            commentId: comment.id,
            content: contentToSubmit
        });
    };

    const startEditing = () => {
        setIsEditing(true);
        setEditContent(comment.content);
        // Try to set JSON if content is JSON, otherwise empty (MentionTextarea handles this)
        try {
            JSON.parse(comment.content);
            setEditJson(comment.content);
        } catch {
            setEditJson('');
        }
    };

    // Limit nesting depth for UI
    const maxDepth = 3;
    const indentationClass = depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-gray-100 dark:border-gray-700 pl-4' : '';

    return (
        <div className={`mt-4 ${indentationClass}`}>
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => deleteMutation.mutateAsync(comment.id)}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone and will delete all replies to this comment."
                confirmLabel="Delete"
                isDestructive={true}
                isLoading={deleteMutation.isPending}
            />

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                            {comment.authorAvatarUrl ? (
                                <img
                                    src={comment.authorAvatarUrl}
                                    alt={comment.authorUsername}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                                    {comment.authorUsername?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {comment.authorUsername || 'Unknown'}
                                </span>
                                {isOwner && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                        Author
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {user && !isEditing && (
                            <button
                                onClick={() => onReply(comment.authorUsername || 'Unknown', comment.id)}
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                            >
                                Reply
                            </button>
                        )}
                        {isOwner && !isEditing && (
                            <button
                                onClick={startEditing}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Edit
                            </button>
                        )}
                        {canDelete && !isEditing && (
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-2">
                        <MentionTextarea
                            value={editJson || editContent}
                            onChangeText={setEditContent}
                            onChange={setEditJson}
                            placeholder="Edit your comment..."
                            rows={3}
                            maxLength={1000}
                            lazyLoad={true}
                            className="bg-white dark:bg-gray-800 mb-2"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleUpdate}
                                isLoading={updateCommentMutation.isPending}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <StrategyDisplay strategy={comment.content} className="text-sm" />
                )}
            </div>

            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            teamId={teamId}
                            depth={depth < maxDepth ? depth + 1 : depth}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
    teamId,
    comments,
    isPublic,
    isAuthenticated
}) => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [commentJson, setCommentJson] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);

    // Comment mutation
    const commentMutation = useMutation({
        mutationFn: async (content: string) => {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_URL}/teams/${teamId}/comments`,
                { content, parentId: replyTo?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamComments', teamId] });
            setCommentText('');
            setCommentJson('');
            setReplyTo(null);
        },
    });

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const contentToSubmit = commentJson || commentText.trim();
        await commentMutation.mutateAsync(contentToSubmit);
    };

    const handleReply = (author: string, id: string) => {
        setReplyTo({ id, author });
        // Scroll to input
        const form = document.getElementById('comment-form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus textarea
            const textarea = form.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    };

    if (!isPublic) return null;

    const totalComments = comments.reduce((acc, c) => {
        const countReplies = (replies?: ExtendedComment[]): number => {
            if (!replies) return 0;
            return replies.reduce((rAcc, r) => rAcc + 1 + countReplies(r.replies), 0);
        };
        return acc + 1 + countReplies(c.replies);
    }, 0);

    const MAX_COMMENTS = 500;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Comments
                </h2>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${totalComments >= MAX_COMMENTS ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {totalComments} / {MAX_COMMENTS}
                </span>
            </div>

            {/* Comment Form */}
            {isAuthenticated ? (
                <form id="comment-form" onSubmit={handleComment} className="mb-8">
                    {replyTo && (
                        <div className="mb-3 text-sm flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border-l-4 border-primary-500">
                            <span className="text-gray-600 dark:text-gray-300">
                                Replying to <strong>{replyTo.author}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="ml-auto text-xs text-gray-500 hover:text-red-500 font-medium"
                            >
                                CANCEL
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <MentionTextarea
                            value={commentJson || commentText}
                            onChangeText={setCommentText}
                            onChange={setCommentJson}
                            placeholder={replyTo ? `Reply to ${replyTo.author}...` : "Share your thoughts... Use @ to mention Pokemon, Moves, etc."}
                            rows={3}
                            maxLength={1000}
                            lazyLoad={true}
                            className="bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                        <span className={`text-xs ${commentText.length > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {commentText.length}/1000
                        </span>
                        <Button
                            type="submit"
                            disabled={!commentText.trim() || commentMutation.isPending}
                            variant="primary"
                        >
                            {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="mb-8 text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">
                        Join the discussion!
                    </p>
                    <Button href={`/auth?redirect=/teams/${teamId}`} variant="primary">
                        {t('auth.login')}
                    </Button>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-8 opacity-60">
                        <div className="text-4xl mb-2">💭</div>
                        <p className="text-gray-500 dark:text-gray-400">
                            No comments yet. Be the first to share your strategy!
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            teamId={teamId}
                            onReply={handleReply}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
