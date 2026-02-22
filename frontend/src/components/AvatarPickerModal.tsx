import { type KeyboardEvent, useEffect, useRef } from "react";
import { EmojiPicker } from "./EmojiPicker";
import { borderRadius, colors, spacing, typography } from "./ui/tokens";

interface AvatarPickerModalProps {
	open: boolean;
	selected: string;
	onSelect: (emoji: string) => void;
	onClose: () => void;
}

export function AvatarPickerModal({ open, selected, onSelect, onClose }: AvatarPickerModalProps) {
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	// Focus the close button when the modal opens
	useEffect(() => {
		if (open) {
			closeButtonRef.current?.focus();
		}
	}, [open]);

	// Escape key dismissal via window listener (avoids interactive static element)
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	const handleDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Tab") {
			const focusable = e.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled])");
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismisses modal on pointer click; keyboard (Escape) is handled via window listener
		<div
			role="presentation"
			style={{
				position: "fixed",
				inset: 0,
				backgroundColor: "rgba(0, 0, 0, 0.75)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Choose your avatar"
				style={{
					position: "relative",
					backgroundColor: colors.surface,
					border: `1px solid ${colors.border}`,
					borderRadius: borderRadius.lg,
					padding: spacing.lg,
					width: "90%",
					maxWidth: "380px",
					maxHeight: "90vh",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					gap: spacing.md,
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleDialogKeyDown}
			>
				<button
					ref={closeButtonRef}
					type="button"
					aria-label="Close avatar picker"
					onClick={onClose}
					style={{
						position: "absolute",
						top: spacing.sm,
						right: spacing.sm,
						background: "none",
						border: "none",
						color: colors.textSecondary,
						fontSize: typography.sizes.lg,
						cursor: "pointer",
						lineHeight: 1,
						padding: spacing.xs,
						borderRadius: borderRadius.sm,
					}}
				>
					✕
				</button>

				<h3
					style={{
						color: colors.text,
						fontSize: typography.sizes.lg,
						fontFamily: typography.fontFamily,
						margin: 0,
					}}
				>
					Choose Your Avatar
				</h3>

				<div style={{ overflowY: "auto" }}>
					<EmojiPicker
						selected={selected}
						onSelect={(emoji) => {
							onSelect(emoji);
							onClose();
						}}
					/>
				</div>
			</div>
		</div>
	);
}
