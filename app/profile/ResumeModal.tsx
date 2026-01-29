'use client';

import { FileText } from 'lucide-react';

interface ResumeModalProps {
  show: boolean;
  text: string;
  onClose: () => void;
}

export default function ResumeModal({ show, text, onClose }: ResumeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-charcoal border border-electric rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-electric" />
            What AI Sees in Your Resume
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-void border border-border rounded-lg p-4">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {text || 'No text extracted'}
            </pre>
          </div>

          <div className="mt-4 bg-electric/10 border border-electric/30 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              Make sure your resume text is readable for accurate AI matching.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
