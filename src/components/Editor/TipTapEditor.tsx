import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { PokemonMention } from './PokemonMention';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMentions, MentionOption } from '@/hooks/useMentions';
import { MentionAutocomplete } from '@/components/Strategy/MentionAutocomplete';
import axios from 'axios';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export function TipTapEditor({ content, onChange, placeholder, onImageUpload }: TipTapEditorProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { options, loading, searchMentions } = useMentions();

  // Filter to only show Pokemon
  const pokemonOptions = options.filter(opt => opt.type === 'pokemon');

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration error
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Exclude code blocks per user request
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 hover:text-primary-700 underline',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your article content here...',
      }),
      PokemonMention,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Search mentions with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMentions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMentions]);

  // Handle @ character detection
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      const textBefore = $from.nodeBefore?.text || '';

      // Check for @ at the end of text
      const atIndex = textBefore.lastIndexOf('@');
      if (atIndex !== -1) {
        const query = textBefore.slice(atIndex + 1);

        // Only show if @ is recent and no spaces after it
        if (!query.includes(' ') && query.length < 50) {
          setSearchQuery(query);
          setShowAutocomplete(true);
          setSelectedIndex(0);

          // Calculate position
          const coords = editor.view.coordsAtPos(selection.from);
          setAutocompletePosition({
            top: coords.bottom + 5,
            left: coords.left,
          });
          return;
        }
      }

      setShowAutocomplete(false);
    };

    editor.on('update', handleTransaction);
    editor.on('selectionUpdate', handleTransaction);

    return () => {
      editor.off('update', handleTransaction);
      editor.off('selectionUpdate', handleTransaction);
    };
  }, [editor]);

  // Handle mention selection
  const handleSelectMention = useCallback(
    (option: MentionOption) => {
      if (!editor || option.type !== 'pokemon') return;

      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      const textBefore = $from.nodeBefore?.text || '';
      const atIndex = textBefore.lastIndexOf('@');

      if (atIndex !== -1) {
        // Calculate the position to delete from
        const from = selection.from - (textBefore.length - atIndex);
        const to = selection.from;

        // Delete the @ and query text, then insert mention
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent({
            type: 'pokemonMention',
            attrs: {
              id: option.id,
              nationalNumber: option.nationalNumber,
              name: option.name,
            },
          })
          .insertContent(' ') // Add space after mention
          .run();
      }

      setShowAutocomplete(false);
    },
    [editor]
  );

  // Handle keyboard navigation in autocomplete
  useEffect(() => {
    if (!showAutocomplete || !editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, pokemonOptions.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter' && pokemonOptions.length > 0) {
        event.preventDefault();
        handleSelectMention(pokemonOptions[selectedIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowAutocomplete(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAutocomplete, pokemonOptions, selectedIndex, handleSelectMention, editor]);

  if (!editor) {
    return null;
  }

  // Toolbar button component
  const ToolbarButton = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-primary-100 text-primary-600' : 'text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  // Handle image file upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContentImage(true);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Maximum size is 5MB.');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/admin/news/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = `${API_URL.replace('/api', '')}${response.data.url}`;
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingContentImage(false);
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Insert image handler - now triggers file upload
  const handleInsertImage = () => {
    imageInputRef.current?.click();
  };

  // Insert link handler
  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Insert YouTube handler
  const handleInsertYoutube = () => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={handleInsertImage}
          disabled={uploadingContentImage}
          title={uploadingContentImage ? "Uploading..." : "Insert Image"}
        >
          {uploadingContentImage ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <ImageIcon size={18} />
          )}
        </ToolbarButton>

        <ToolbarButton onClick={handleInsertLink} title="Insert Link">
          <LinkIcon size={18} />
        </ToolbarButton>

        <ToolbarButton onClick={handleInsertYoutube} title="Insert YouTube Video">
          <YoutubeIcon size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={18} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="relative min-h-[400px]">
        <EditorContent
          editor={editor}
          className="prose max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:outline-none"
        />

        {/* Pokemon Autocomplete */}
        {showAutocomplete && (
          <div
            className="fixed z-50"
            style={{
              top: autocompletePosition.top,
              left: autocompletePosition.left,
            }}
          >
            <MentionAutocomplete
              options={pokemonOptions}
              selectedIndex={selectedIndex}
              onSelect={handleSelectMention}
              position={{ top: 0, left: 0 }}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
