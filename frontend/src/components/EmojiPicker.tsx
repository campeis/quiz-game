const EMOJIS = [
	"🦁", "🐯", "🐻", "🦊", "🐼", "🐨", "🦄", "🐸", "🐙", "🦋",
	"🌈", "🎮", "🚀", "⭐", "🎯", "🎲", "🏆", "🦸", "🧙", "🤖",
	"👾", "🌟", "🔥", "⚡", "🌊", "🍕", "🎪", "🎭", "🎨", "🎸",
];

interface EmojiPickerProps {
	onSelect: (emoji: string) => void;
	selected: string;
}

export function EmojiPicker({ onSelect, selected }: EmojiPickerProps) {
	return (
		<div className="emoji-picker">
			{EMOJIS.map((emoji) => (
				<button
					key={emoji}
					type="button"
					aria-pressed={emoji === selected}
					onClick={() => onSelect(emoji)}
					className={emoji === selected ? "selected" : ""}
				>
					{emoji}
				</button>
			))}
		</div>
	);
}
