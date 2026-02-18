import { useRef, useState } from "react";
import type { ApiError, QuizPreview } from "../services/api";
import { uploadQuiz } from "../services/api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors, spacing, typography } from "./ui/tokens";

interface QuizUploadProps {
	onQuizUploaded: (preview: QuizPreview) => void;
}

export function QuizUpload({ onQuizUploaded }: QuizUploadProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleUpload = async () => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) {
			setError("Please select a quiz file");
			return;
		}

		setLoading(true);
		setError(null);
		setErrors([]);

		try {
			const preview = await uploadQuiz(file);
			onQuizUploaded(preview);
		} catch (err) {
			const apiError = err as ApiError;
			if (apiError.messages) {
				setErrors(apiError.messages);
			} else {
				setError(apiError.message || "Failed to upload quiz");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card style={{ maxWidth: "500px", width: "100%" }}>
			<h2 style={{ color: colors.text, fontSize: typography.sizes.xl, marginBottom: spacing.md }}>
				Upload Quiz File
			</h2>
			<p style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
				Select a .txt quiz file to upload
			</p>
			<input
				ref={fileInputRef}
				type="file"
				accept=".txt,text/plain"
				aria-label="Quiz file"
				style={{
					display: "block",
					width: "100%",
					padding: spacing.sm,
					marginBottom: spacing.lg,
					color: colors.text,
					fontFamily: typography.fontFamily,
				}}
			/>
			<Button onClick={handleUpload} loading={loading} style={{ width: "100%" }}>
				Upload Quiz
			</Button>
			{error && (
				<p role="alert" style={{ color: colors.error, marginTop: spacing.md }}>
					{error}
				</p>
			)}
			{errors.length > 0 && (
				<div role="alert" aria-label="Validation errors" style={{ marginTop: spacing.md }}>
					<p
						style={{
							color: colors.error,
							fontWeight: typography.weights.semibold,
							marginBottom: spacing.sm,
						}}
					>
						Validation errors:
					</p>
					{errors.map((e) => (
						<p key={e.line} style={{ color: colors.error, fontSize: typography.sizes.sm }}>
							Line {e.line}: {e.message}
						</p>
					))}
				</div>
			)}
		</Card>
	);
}
