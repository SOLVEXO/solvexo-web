import { Avatar } from '@/components/comman/ui';

interface ChatAvatarProps {
  name:       string;
  image?:     string | null;
  size?:      number;
  online?:    boolean;
  className?: string;
}

// Instagram/WhatsApp-style avatar: real photo if we have one, else the
// app's initials Avatar. The small green dot mirrors the "online" pip
// both platforms show on a contact's avatar.
export function ChatAvatar({ name, image, size = 40, online, className }: ChatAvatarProps) {
  return (
    <div className={className} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {image ? (
        <img
          src={image}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <Avatar name={name} size={size} />
      )}
      {online && (
        <span
          className="absolute rounded-full bg-[#31A24C] border-2 border-white"
          style={{ width: size * 0.28, height: size * 0.28, right: -1, bottom: -1 }}
        />
      )}
    </div>
  );
}
