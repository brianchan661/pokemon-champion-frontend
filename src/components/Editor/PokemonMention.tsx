import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';

// Define the Pokemon mention node
export const PokemonMention = Node.create({
  name: 'pokemonMention',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({
          'data-id': attributes.id,
        }),
      },
      nationalNumber: {
        default: null,
        parseHTML: element => element.getAttribute('data-national-number'),
        renderHTML: attributes => ({
          'data-national-number': attributes.nationalNumber,
        }),
      },
      name: {
        default: null,
        parseHTML: element => element.getAttribute('data-name'),
        renderHTML: attributes => ({
          'data-name': attributes.name,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="pokemon-mention"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'pokemon-mention' }, HTMLAttributes), `@${HTMLAttributes['data-name']}`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PokemonMentionComponent);
  },
});

// React component for rendering the mention as a chip (matching MentionChip style)
function PokemonMentionComponent(props: any) {
  const { node } = props;
  const { nationalNumber, name, id } = node.attrs;
  const [pokemonData, setPokemonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPokemonData() {
      try {
        const response = await pokemonBuilderService.getPokemonList();
        if (response.success && response.data) {
          const pokemon = response.data.find(p => p.id === id || p.nationalNumber === nationalNumber);
          if (pokemon) {
            setPokemonData(pokemon);
          }
        }
      } catch (error) {
        console.error('Failed to load Pokemon data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPokemonData();
  }, [id, nationalNumber]);

  if (loading) {
    return (
      <NodeViewWrapper as="span" className="inline-block">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 text-sm">
          <span className="text-xs">Loading...</span>
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline mx-0.5" style={{ verticalAlign: 'baseline' }}>
      <Link
        href={`/pokemon/${nationalNumber}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
        data-type="pokemon-mention"
        data-id={id}
        data-national-number={nationalNumber}
        data-name={name}
      >
        {pokemonData?.imageUrl && (
          <img
            src={pokemonData.imageUrl}
            alt={name}
            className="w-4 h-4 object-contain flex-shrink-0"
          />
        )}
        <span className="text-sm font-medium leading-none">{name}</span>
      </Link>
    </NodeViewWrapper>
  );
}
