import type { Message } from '@/api/commerce/messaging';

export interface MessageGroup {
  senderId:  string;
  messages:  Message[];
}

export interface DateSection {
  dateLabel: string;
  groups:    MessageGroup[];
}

const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min from the same sender are visually grouped

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

// Instagram/WhatsApp-style grouping: consecutive messages from the same
// sender within a short window collapse into one visual block (single
// avatar, tighter spacing), bucketed under "Today" / "Yesterday" dividers.
export function groupMessages(messages: Message[]): DateSection[] {
  const sections: DateSection[] = [];

  for (const message of messages) {
    const label = dateLabel(message.createdAt);
    let section = sections.find(s => s.dateLabel === label);
    if (!section) {
      section = { dateLabel: label, groups: [] };
      sections.push(section);
    }

    const lastGroup = section.groups[section.groups.length - 1];
    const lastMessage = lastGroup?.messages[lastGroup.messages.length - 1];
    const withinWindow = lastMessage
      ? new Date(message.createdAt).getTime() - new Date(lastMessage.createdAt).getTime() < GROUP_WINDOW_MS
      : false;

    if (lastGroup && lastGroup.senderId === message.senderId && withinWindow) {
      lastGroup.messages.push(message);
    } else {
      section.groups.push({ senderId: message.senderId, messages: [message] });
    }
  }

  return sections;
}
