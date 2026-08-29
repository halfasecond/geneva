import React, { useEffect, useRef } from 'react';

type AutoResizeTextareaProps = {
  content: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ content, onChange, disabled }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Adjust height to fit content
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    onChange(textarea.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleInput}
      {...{ disabled }}
      style={{ width: '100%', overflow: 'hidden', resize: 'none' }}
    />
  );
};

export default AutoResizeTextarea;
