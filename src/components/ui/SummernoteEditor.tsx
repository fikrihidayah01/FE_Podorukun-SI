import { useEffect, useRef } from 'react';
import $ from '../../lib/jquery';
import 'summernote/dist/summernote-lite.css';
import 'summernote/dist/summernote-lite.js';

interface SummernoteEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function SummernoteEditor({
  value,
  onChange,
  placeholder = 'Tulis isi atau uraian dokumen di sini...',
  height = 260,
}: SummernoteEditorProps) {
  const containerRef = useRef<HTMLTextAreaElement>(null);
  const onChangeRef = useRef(onChange);
  const isInternalChange = useRef(false);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const $el = $(containerRef.current);

    ($el as any).summernote({
      placeholder,
      height,
      minHeight: 160,
      dialogsInBody: true,
      tabsize: 2,
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'hr']],
        ['view', ['fullscreen', 'codeview', 'undo', 'redo']],
      ],
      callbacks: {
        onChange: (contents: string) => {
          isInternalChange.current = true;
          onChangeRef.current(contents);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 0);
        },
      },
    });

    if (initialValueRef.current) {
      ($el as any).summernote('code', initialValueRef.current);
    }

    return () => {
      try {
        ($el as any).summernote('destroy');
      } catch (e) {
        console.error('Failed to destroy summernote instance', e);
      }
    };
  }, [placeholder, height]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isInternalChange.current) return;

    const $el = $(containerRef.current);
    const currentVal = ($el as any).summernote('code');
    if (currentVal !== value) {
      ($el as any).summernote('code', value || '');
    }
  }, [value]);

  return (
    <div className="summernote-wrapper w-full">
      <textarea ref={containerRef} defaultValue={value} />
      <style>{`
        /* Summernote disesuaikan dengan token desain (index.css) */
        .note-editor.note-frame {
          border: 1px solid var(--color-line-strong) !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
          box-shadow: none !important;
        }
        .note-editor.note-frame:focus-within {
          border-color: var(--color-brand-600) !important;
          box-shadow: 0 0 0 3px var(--color-brand-100) !important;
        }
        .note-editor .note-toolbar {
          background-color: var(--color-subtle) !important;
          border-bottom: 1px solid var(--color-line) !important;
          padding: 0.375rem 0.5rem !important;
        }
        .note-editor .note-btn {
          background-color: var(--color-surface) !important;
          border: 1px solid var(--color-line) !important;
          border-radius: 0.375rem !important;
          padding: 0.25rem 0.5rem !important;
          font-size: 0.8125rem !important;
          color: var(--color-ink-2) !important;
        }
        .note-editor .note-btn:hover {
          background-color: var(--color-neutral-soft) !important;
          color: var(--color-ink) !important;
        }
        .note-editor .note-btn.active {
          background-color: var(--color-brand-50) !important;
          border-color: var(--color-brand-200) !important;
          color: var(--color-brand-700) !important;
        }
        .note-editor .note-statusbar {
          background-color: var(--color-subtle) !important;
          border-top: 1px solid var(--color-line) !important;
        }
        .note-editor .note-editable {
          background-color: var(--color-surface) !important;
          font-family: inherit !important;
          font-size: 0.9375rem !important;
          line-height: 1.65 !important;
          color: var(--color-ink) !important;
          padding: 0.875rem 1rem !important;
        }
        .note-editor .note-placeholder {
          color: var(--color-ink-3) !important;
          padding: 0.875rem 1rem !important;
        }
        .note-editor .note-dropdown-menu {
          z-index: 1050 !important;
          border-radius: 0.5rem !important;
          box-shadow: var(--shadow-pop) !important;
          border: 1px solid var(--color-line) !important;
        }
        .note-modal-backdrop {
          z-index: 1060 !important;
        }
        .note-modal {
          z-index: 1070 !important;
        }
      `}</style>
    </div>
  );
}
