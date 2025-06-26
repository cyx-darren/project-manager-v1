import React from 'react';
import type { TypingIndicator as TypingIndicatorType } from '../../services/presenceService';

interface TypingIndicatorProps {
  typingIndicators: TypingIndicatorType[];
  fieldName?: string;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingIndicators,
  fieldName,
  className = ''
}) => {
  // Filter typing indicators by field name if specified
  const relevantIndicators = fieldName
    ? typingIndicators.filter(indicator => indicator.field_name === fieldName && indicator.is_typing)
    : typingIndicators.filter(indicator => indicator.is_typing);

  if (relevantIndicators.length === 0) {
    return null;
  }

  const getUserName = (indicator: TypingIndicatorType) => {
    return indicator.user?.user_metadata?.full_name || 
           indicator.user?.email?.split('@')[0] || 
           'Someone';
  };

  const getTypingText = () => {
    const names = relevantIndicators.map(getUserName);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      {/* Animated typing dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      {/* Typing text */}
      <span className="italic">
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator; 