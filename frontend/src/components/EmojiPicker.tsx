import { useState } from "react";
import { colors } from "./ui/tokens";

const EMOJIS = [
	"🦁",
	"🐯",
	"🐻",
	"🦊",
	"🐼",
	"🐨",
	"🦄",
	"🐸",
	"🐙",
	"🦋",
	"🌈",
	"🎮",
	"🚀",
	"⭐",
	"🎯",
	"🎲",
	"🏆",
	"🦸",
	"🧙",
	"🤖",
	"👾",
	"🌟",
	"🔥",
	"⚡",
	"🌊",
	"🍕",
	"🎪",
	"🎭",
	"🎨",
	"🎸",
];

interface EmojiPickerProps {
	onSelect: (emoji: string) => void;
	selected: string;
}

export function EmojiPicker({ onSelect, selected }: EmojiPickerProps) {
	const [hovered, setHovered] = useState<string | null>(null);

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(5, 1fr)",
				gap: "8px",
				backgroundColor: colors.surface,
			}}
		>
			{EMOJIS.map((emoji) => {
				const isSelected = emoji === selected;
				const isHovered = emoji === hovered;
				return (
					<button
						key={emoji}
						type="button"
						aria-pressed={isSelected}
						onClick={() => onSelect(emoji)}
						onMouseEnter={() => setHovered(emoji)}
						onMouseLeave={() => setHovered(null)}
						style={{
							fontSize: "1.5rem",
							padding: "8px",
							cursor: "pointer",
							backgroundColor: isSelected ? `${colors.primary}22` : "transparent",
							border: isSelected
								? `2px solid ${colors.primary}`
								: isHovered
									? `1px solid ${colors.accent}`
									: `1px solid ${colors.borderDim}`,
							borderRadius: "4px",
							transition: "border-color 0.1s ease",
						}}
					>
						{emoji}
					</button>
				);
			})}
		</div>
	);
}
