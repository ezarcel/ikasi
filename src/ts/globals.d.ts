declare global {
	interface RecentsEntry {
		filename: string
		timestamp: number
	}

	interface IBubble {
		height: number
		id: string
		image: MindMapImage
		text: string
		width: number
		x: number
		y: number
	}
	type MindMapExportingFormat = "png" | "jpeg" | "pdf"
	type MindMapLink = [ string, string ]
	type MindMapImageFormat = "png" | "jpg" | "jpeg" | "gif" | "webp" | "avif"
	interface MindMapImage {
		base64Image: string
		format: MindMapImageFormat
	}
	interface MindMapSettings {
		backgroundColor: string
		borderColor: string
		borderWidth: number
		bubbleColor: string
		bubblePaddingSize: number
		exportingMargin: number
		fontColor: string
		fontFamily: string
		fontSize: number
		lineColor: string
		lineWidth: number
	}
	interface MindMapData {
		bubbles: IBubble[]
		links: MindMapLink[]
		settings: MindMapSettings
	}
	type BubbleDragMode = "resize" | "move"
	type BubbleStatus = "expanded" | "normal"
	type BubbleResizeDirection = "tl" | "tr" | "bl" | "br"

	interface ICard {
		backgroundColor: string
		content: string
		subtitle: string
		title: string
	}
	interface DOCData {
		cards: ICard[]
	}
	interface RGBAColor {
		[ key: string ]: number
		red: number
		green: number
		blue: number
		alpha: number
	}

	interface IToDo {
		description: string
		done: boolean
		dueDate: number
		dueTime: number
		title: string
	}
	interface ToDoData {
		todos: IToDo[]
	}
}

export {}