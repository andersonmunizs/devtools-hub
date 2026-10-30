import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Binary,
  Braces,
  Clock,
  Fingerprint,
  Hash,
  Link,
  Search,
  X,
} from 'lucide-react';
import type { Tool } from '../../data/tools';
import { searchTools } from '../../lib/search-tools';

const identities = {
  json: { icon: Braces, actions: 'Validar · Formatar · Minificar' },
  base64: { icon: Binary, actions: 'Codificar · Decodificar' },
  url: { icon: Link, actions: 'Codificar · Decodificar' },
  timestamp: { icon: Clock, actions: 'Segundos · Milissegundos · UTC' },
  uuid: { icon: Fingerprint, actions: 'Gerar · Copiar individual ou lista' },
  hash: { icon: Hash, actions: 'Texto UTF-8 → SHA-256' },
};

export default function SearchTools({ tools }: { tools: readonly Tool[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [ready, setReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setReady(true);
  }, []);
  const categories = ['Todas', ...new Set(tools.map((tool) => tool.category))];
  const matches = searchTools(tools, query).filter(
    (tool) => category === 'Todas' || tool.category === category,
  );
  const filtered = query.length > 0 || category !== 'Todas';
  function reset() {
    setQuery('');
    setCategory('Todas');
    searchRef.current?.focus();
  }
  return (
    <section
      aria-labelledby="catalog-heading"
      id="ferramentas"
      className="catalog"
    >
      <div className="section-heading">
        <div>
          <h2 id="catalog-heading">Catálogo de ferramentas</h2>
          <p className="catalog-intro">Qual tarefa você quer resolver?</p>
        </div>
        <span className="catalog-local">Processamento local</span>
      </div>
      <label htmlFor="tool-search" className="search-label">
        Buscar ferramentas
      </label>
      <div className="search-field">
        <Search size={20} aria-hidden="true" />
        <input
          ref={searchRef}
          id="tool-search"
          type="search"
          value={query}
          autoComplete="off"
          maxLength={160}
          placeholder="Ex.: formatar JSON, converter data, gerar UUID…"
          aria-describedby="search-help"
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            className="search-clear"
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              setQuery('');
              searchRef.current?.focus();
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <p id="search-help" className="field-help">
        Busque pelo nome ou pela tarefa. O termo fica neste navegador.
      </p>
      <div
        className="catalog-filters"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {categories.map((value) => (
          <button
            type="button"
            key={value}
            disabled={!ready}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="catalog-results">
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="search-status"
        >
          {matches.length}{' '}
          {matches.length === 1
            ? 'ferramenta encontrada'
            : 'ferramentas encontradas'}
        </p>
        {filtered && (
          <button type="button" className="reset-search" onClick={reset}>
            Limpar busca e filtros
          </button>
        )}
      </div>
      {matches.length === 0 ? (
        <div className="empty-catalog">
          <Search size={24} aria-hidden="true" />
          <div>
            <h3>Nenhuma ferramenta encontrada</h3>
            <p>Tente um termo mais curto ou selecione outra categoria.</p>
          </div>
        </div>
      ) : (
        <ul className="tool-list">
          {matches.map((tool) => {
            const identity = identities[tool.slug as keyof typeof identities];
            const Icon = identity?.icon ?? Braces;
            return (
              <li key={tool.slug}>
                <a
                  href={'/ferramentas/' + tool.slug + '/'}
                  className={'tool-entry tool-' + tool.slug}
                >
                  <span className="tool-icon">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <div className="tool-summary">
                    <span className="eyebrow">{tool.category}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <span className="tool-actions-preview">
                      {identity?.actions ?? tool.category}
                    </span>
                  </div>
                  <ArrowRight
                    className="tool-open"
                    size={18}
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
