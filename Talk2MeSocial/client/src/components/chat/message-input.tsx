import { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Image, Mic, Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 bg-surface border-t border-border">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="text-primary">
          <Plus className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-primary">
          <Image className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-primary">
          <Mic className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 mx-2 bg-background rounded-full px-4 py-2 flex items-center">
          <Input
            type="text"
            placeholder="Message..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-primary ${!value.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onSend}
          disabled={!value.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
