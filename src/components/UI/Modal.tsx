import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

interface ModalBodyProps {
  children: React.ReactNode;
}

interface ModalFooterProps {
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
          <ModalHeader title={title} onClose={onClose} />
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onClose} icon={X} className="p-2">
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className="p-6">{children}</div>;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
      {children}
    </div>
  );
}