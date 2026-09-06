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
        /* Polish Summernote for Tailwind */
        .note-editor.note-frame {
          border: 1px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .note-editor .note-toolbar {
          background-color: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 0.375rem 0.5rem !important;
        }
        .note-editor .note-btn {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.375rem !important;
          padding: 0.25rem 0.5rem !important;
          font-size: 0.8125rem !important;
          color: #374151 !important;
        }
        .note-editor .note-btn:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        .note-editor .note-btn.active {
          background-color: #e0e7ff !important;
          border-color: #c7d2fe !important;
          color: #4338ca !important;
        }
        .note-editor .note-statusbar {
          background-color: #f9fafb !important;
          border-top: 1px solid #f3f4f6 !important;
        }
        .note-editor .note-editable {
          background-color: #ffffff !important;
          font-family: inherit !important;
          font-size: 0.875rem !important;
          line-height: 1.6 !important;
          color: #1f2937 !important;
          padding: 0.75rem 1rem !important;
        }
        .note-editor .note-dropdown-menu {
          z-index: 1050 !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid #e5e7eb !important;
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
